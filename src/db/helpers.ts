import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import type { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';
import {
    DeleteCommand,
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
    DeleteCommandInput,
    GetCommandInput,
    NativeAttributeValue,
    PutCommandInput,
    QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || import.meta.env.AWS_REGION || 'us-east-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || import.meta.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || import.meta.env.AWS_SECRET_ACCESS_KEY;
const endpoint = process.env.DYNAMODB_ENDPOINT || import.meta.env.DYNAMODB_ENDPOINT;

const credentials =
    accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey, sessionToken: process.env.AWS_SESSION_TOKEN || import.meta.env.AWS_SESSION_TOKEN }
        : undefined;

export const dynamoClient = new DynamoDBClient({
    region,
    ...(credentials ? { credentials } : {}),
    ...(endpoint ? { endpoint } : {}),
});

export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: { removeUndefinedValues: true },
});

export async function getItem(table: CreateTableCommandInput, key: GetCommandInput['Key']): Promise<NativeAttributeValue> {
    return (await docClient.send(new GetCommand({ TableName: table.TableName, Key: key }))).Item ?? null;
}

export async function setItem(table: CreateTableCommandInput, item: PutCommandInput['Item']): Promise<void> {
    await docClient.send(new PutCommand({ TableName: table.TableName, Item: item }));
}

export async function deleteItem(table: CreateTableCommandInput, key: DeleteCommandInput['Key']): Promise<void> {
    await docClient.send(new DeleteCommand({ TableName: table.TableName, Key: key }));
}

export async function queryItems(table: CreateTableCommandInput, input: Omit<QueryCommandInput, 'TableName'>): Promise<NativeAttributeValue[]> {
    return (await docClient.send(new QueryCommand({ TableName: table.TableName, ...input }))).Items ?? [];
}

export async function verifyDynamoConnection(): Promise<boolean> {
    try {
        await dynamoClient.send(new ListTablesCommand({ Limit: 1 }));
        return true;
    } catch (error) {
        console.error('DynamoDB connection failed:', error);
        return false;
    }
}
