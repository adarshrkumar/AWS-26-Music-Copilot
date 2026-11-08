import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { NativeAttributeValue } from '@aws-sdk/lib-dynamodb';
import { createAdapterFactory } from 'better-auth/adapters';
import type { CleanedWhere, CustomAdapter } from 'better-auth/adapters';
import { docClient, tableName } from '@/db';

// Every auth record is stored with pk "AUTH#<model>" and sk set to the record's id. DynamoDB can only look items up by key, so any lookup other than by id queries the model's partition and filters here, which is fine for auth tables of this size.

type Row = Record<string, NativeAttributeValue>;
type Scalar = string | number | boolean | null;
type CreateArgs = Parameters<CustomAdapter['create']>[0];
type FindOneArgs = Parameters<CustomAdapter['findOne']>[0];
type FindManyArgs = Parameters<CustomAdapter['findMany']>[0];
type UpdateArgs = Parameters<CustomAdapter['update']>[0];
type ConsumeArgs = Parameters<NonNullable<CustomAdapter['consumeOne']>>[0];
type IncrementArgs = Parameters<NonNullable<CustomAdapter['incrementOne']>>[0];

function partition(model: string): string {
    return `AUTH#${model}`;
}

function toRow(item: Row): Row {
    return Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'pk' && key !== 'sk'));
}

function pick(row: Row, select?: string[]): Row {
    return select?.length ? Object.fromEntries(select.map(field => [field, row[field]])) : row;
}

function normalize(value: NativeAttributeValue, mode: CleanedWhere['mode']): Scalar {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return mode === 'insensitive' ? value.toLowerCase() : value;
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    return null;
}

function compare(a: Scalar, b: Scalar): number | null {
    if (a === null || b === null) return null;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return a.toString() < b.toString() ? -1 : a.toString() > b.toString() ? 1 : 0;
}

function matchesClause(row: Row, { field, operator, value, mode }: CleanedWhere): boolean {
    const actual = normalize(row[field], mode);

    if (Array.isArray(value)) {
        const included = value.map(item => normalize(item, mode)).includes(actual);
        return operator === 'not_in' ? !included : included;
    }

    const expected = normalize(value, mode);
    const order = compare(actual, expected);

    switch (operator) {
        case 'ne':
            return actual !== expected;
        case 'lt':
            return order !== null && order < 0;
        case 'lte':
            return order !== null && order <= 0;
        case 'gt':
            return order !== null && order > 0;
        case 'gte':
            return order !== null && order >= 0;
        case 'contains':
            return typeof actual === 'string' && typeof expected === 'string' && actual.includes(expected);
        case 'starts_with':
            return typeof actual === 'string' && typeof expected === 'string' && actual.startsWith(expected);
        case 'ends_with':
            return typeof actual === 'string' && typeof expected === 'string' && actual.endsWith(expected);
        default:
            return actual === expected;
    }
}

function matchesWhere(row: Row, where: CleanedWhere[]): boolean {
    const alternatives = where.filter(clause => clause.connector === 'OR');
    return (
        where.filter(clause => clause.connector !== 'OR').every(clause => matchesClause(row, clause)) &&
        (alternatives.length === 0 || alternatives.some(clause => matchesClause(row, clause)))
    );
}

async function queryModel(model: string): Promise<Row[]> {
    const rows: Row[] = [];
    let startKey: Row | undefined;

    do {
        const page = await docClient.send(
            new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: 'pk = :pk',
                ExpressionAttributeValues: { ':pk': partition(model) },
                ExclusiveStartKey: startKey,
                ConsistentRead: true,
            }),
        );
        rows.push(...(page.Items ?? []).map(toRow));
        startKey = page.LastEvaluatedKey;
    } while (startKey);

    return rows;
}

async function findRows(model: string, where: CleanedWhere[] = []): Promise<Row[]> {
    const [first] = where;

    if (where.length === 1 && first.field === 'id' && first.operator === 'eq' && typeof first.value === 'string') {
        const { Item } = await docClient.send(
            new GetCommand({
                TableName: tableName,
                Key: { pk: partition(model), sk: first.value },
                ConsistentRead: true,
            }),
        );
        return Item ? [toRow(Item)] : [];
    }

    return (await queryModel(model)).filter(row => matchesWhere(row, where));
}

async function writeRow(model: string, row: Row): Promise<void> {
    await docClient.send(new PutCommand({ TableName: tableName, Item: { ...row, pk: partition(model), sk: row.id } }));
}

async function removeRow(model: string, row: Row): Promise<void> {
    await docClient.send(new DeleteCommand({ TableName: tableName, Key: { pk: partition(model), sk: row.id } }));
}

async function createRow({ model, data, select }: CreateArgs): Promise<NativeAttributeValue> {
    await writeRow(model, data);
    return pick(data, select);
}

async function findOneRow({ model, where, select }: FindOneArgs): Promise<NativeAttributeValue> {
    const [row] = await findRows(model, where);
    return row ? pick(row, select) : null;
}

async function findManyRows({ model, where, limit, select, sortBy, offset = 0 }: FindManyArgs): Promise<NativeAttributeValue[]> {
    const rows = await findRows(model, where);

    if (sortBy) {
        rows.sort(
            (a, b) =>
                (compare(normalize(a[sortBy.field], 'sensitive'), normalize(b[sortBy.field], 'sensitive')) ?? 0) *
                (sortBy.direction === 'asc' ? 1 : -1),
        );
    }

    return rows.slice(offset, offset + limit).map(row => pick(row, select));
}

async function updateRow({ model, where, update }: UpdateArgs): Promise<NativeAttributeValue> {
    const [row] = await findRows(model, where);
    if (!row) return null;
    const next = Object.assign({}, row, update);
    await writeRow(model, next);
    return next;
}

// A conditional delete makes sure only one caller gets a single-use token when several race for it.
async function consumeRow({ model, where }: ConsumeArgs): Promise<NativeAttributeValue> {
    const [row] = await findRows(model, where);
    if (!row) return null;

    try {
        await docClient.send(
            new DeleteCommand({
                TableName: tableName,
                Key: { pk: partition(model), sk: row.id },
                ConditionExpression: 'attribute_exists(pk)',
            }),
        );
        return row;
    } catch (error) {
        if (error instanceof ConditionalCheckFailedException) return null;
        throw error;
    }
}

async function incrementRow({ model, where, increment, set }: IncrementArgs): Promise<NativeAttributeValue> {
    const [row] = await findRows(model, where);
    if (!row) return null;

    const next: Row = { ...row, ...set };
    const names: Record<string, string> = {};
    const values: Row = {};
    const conditions = Object.entries(increment).map(([field, delta], index) => {
        next[field] = Number(row[field] ?? 0) + delta;
        names[`#f${index}`] = field;
        if (row[field] === undefined) return `attribute_not_exists(#f${index})`;
        values[`:v${index}`] = row[field];
        return `#f${index} = :v${index}`;
    });

    try {
        await docClient.send(
            new PutCommand({
                TableName: tableName,
                Item: { ...next, pk: partition(model), sk: row.id },
                ConditionExpression: conditions.length ? conditions.join(' AND ') : undefined,
                ExpressionAttributeNames: conditions.length ? names : undefined,
                ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
            }),
        );
        return next;
    } catch (error) {
        if (error instanceof ConditionalCheckFailedException) return null;
        throw error;
    }
}

export const dynamoAdapter = createAdapterFactory({
    config: {
        adapterId: 'dynamodb',
        adapterName: 'DynamoDB',
        supportsNumericIds: false,
        supportsJSON: false,
        supportsArrays: false,
        supportsDates: false,
        transaction: false,
    },
    adapter: () => ({
        create: createRow,
        findOne: findOneRow,
        findMany: findManyRows,
        count: async ({ model, where }) => (await findRows(model, where)).length,
        update: updateRow,
        updateMany: async ({ model, where, update }) => {
            const rows = await findRows(model, where);
            await Promise.all(rows.map(row => writeRow(model, { ...row, ...update })));
            return rows.length;
        },
        delete: async ({ model, where }) => {
            const [row] = await findRows(model, where);
            if (row) await removeRow(model, row);
        },
        deleteMany: async ({ model, where }) => {
            const rows = await findRows(model, where);
            await Promise.all(rows.map(row => removeRow(model, row)));
            return rows.length;
        },
        consumeOne: consumeRow,
        incrementOne: incrementRow,
    }),
});
