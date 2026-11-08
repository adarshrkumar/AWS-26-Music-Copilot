import { CreateTableCommand, DynamoDBClient, ResourceInUseException, waitUntilTableExists } from '@aws-sdk/client-dynamodb';

import * as schemas from '../src/db/schemas.ts';

const table = Object.values(schemas).find(candidate => candidate.TableName === process.argv[2]);

if (!table) throw new Error(`No table named "${process.argv[2]}" in src/db/schemas.ts`);

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {}),
});

try {
    await client.send(new CreateTableCommand(table));
    await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName: table.TableName });
    console.log(`Created table ${table.TableName}`);
} catch (error) {
    if (!(error instanceof ResourceInUseException)) throw error;
    console.log(`Table ${table.TableName} already exists`);
}
