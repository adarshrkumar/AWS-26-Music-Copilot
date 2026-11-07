import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
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
    GetCommandOutput,
    PutCommandInput,
    QueryCommandInput,
    QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';

// Vercel reserves the AWS_* variable names, so this project uses DYNAMODB_* names

const region = process.env.DYNAMODB_REGION ?? 'us-east-1';
const accessKeyId = process.env.DYNAMODB_ACCESS_KEY_ID;
const secretAccessKey = process.env.DYNAMODB_SECRET_ACCESS_KEY;
const endpoint = process.env.DYNAMODB_ENDPOINT;

const credentials =
    accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;

export const dynamoClient = new DynamoDBClient({
    region,
    ...(credentials ? { credentials } : {}),
    ...(endpoint ? { endpoint } : {}),
});

export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: { removeUndefinedValues: true },
});

export const tableName = process.env.DYNAMODB_TABLE_NAME ?? 'music-copilot';

export async function getItem(
    key: GetCommandInput['Key'],
): Promise<GetCommandOutput['Item'] | null> {
    const result = await docClient.send(new GetCommand({ TableName: tableName, Key: key }));
    return result.Item ?? null;
}

export async function putItem(item: PutCommandInput['Item']): Promise<void> {
    await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
}

export async function deleteItem(key: DeleteCommandInput['Key']): Promise<void> {
    await docClient.send(new DeleteCommand({ TableName: tableName, Key: key }));
}

export async function queryItems(
    input: Omit<QueryCommandInput, 'TableName'>,
): Promise<NonNullable<QueryCommandOutput['Items']>> {
    const result = await docClient.send(new QueryCommand({ TableName: tableName, ...input }));
    return result.Items ?? [];
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
