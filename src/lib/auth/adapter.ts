import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, GetCommand, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { NativeAttributeValue } from '@aws-sdk/lib-dynamodb';
import { createAdapterFactory } from 'better-auth/adapters';
import type { CleanedWhere, CustomAdapter } from 'better-auth/adapters';
import { docClient } from '@/db/helpers';
import { accountTable, sessionTable, userTable, verificationTable } from '@/db/schemas';

type Row = Record<string, NativeAttributeValue>;
type Scalar = string | number | boolean | null;
type CreateArgs = Parameters<CustomAdapter['create']>[0];
type FindOneArgs = Parameters<CustomAdapter['findOne']>[0];
type FindManyArgs = Parameters<CustomAdapter['findMany']>[0];
type UpdateArgs = Parameters<CustomAdapter['update']>[0];
type ConsumeArgs = Parameters<NonNullable<CustomAdapter['consumeOne']>>[0];
type IncrementArgs = Parameters<NonNullable<CustomAdapter['incrementOne']>>[0];

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

async function findRows(model: string, where: CleanedWhere[] = []): Promise<Row[]> {
    const [first] = where;

    if (where.length === 1 && first.field === 'id' && first.operator === 'eq' && typeof first.value === 'string') {
        const { Item } = await docClient.send(new GetCommand({ TableName: model, Key: { id: first.value }, ConsistentRead: true }));
        return Item ? [Item] : [];
    }

    const indexed = where.find(
        clause =>
            clause.connector === 'AND' &&
            clause.operator === 'eq' &&
            clause.mode === 'sensitive' &&
            typeof clause.value === 'string' &&
            [userTable, sessionTable, accountTable, verificationTable]
                .find(table => table.TableName === model)
                ?.GlobalSecondaryIndexes?.some(index => index.IndexName === clause.field),
    );
    const rows: Row[] = [];
    let startKey: Row | undefined;

    do {
        const page = indexed
            ? await docClient.send(
                new QueryCommand({
                    TableName: model,
                    IndexName: indexed.field,
                    KeyConditionExpression: '#field = :value',
                    ExpressionAttributeNames: { '#field': indexed.field },
                    ExpressionAttributeValues: { ':value': indexed.value },
                    ExclusiveStartKey: startKey,
                }),
            )
            : await docClient.send(new ScanCommand({ TableName: model, ExclusiveStartKey: startKey, ConsistentRead: true }));
        rows.push(...(page.Items ?? []));
        startKey = page.LastEvaluatedKey;
    } while (startKey);

    return rows.filter(row => matchesWhere(row, where));
}

async function writeRow(model: string, row: Row): Promise<void> {
    await docClient.send(new PutCommand({ TableName: model, Item: row }));
}

async function removeRow(model: string, row: Row): Promise<void> {
    await docClient.send(new DeleteCommand({ TableName: model, Key: { id: row.id } }));
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
                TableName: model,
                Key: { id: row.id },
                ConditionExpression: 'attribute_exists(id)',
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
        next[field] = parseFloat((row[field] ?? 0).toString()) + delta;
        names[`#f${index}`] = field;
        if (row[field] === undefined) return `attribute_not_exists(#f${index})`;
        values[`:v${index}`] = row[field];
        return `#f${index} = :v${index}`;
    });

    try {
        await docClient.send(
            new PutCommand({
                TableName: model,
                Item: next,
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
