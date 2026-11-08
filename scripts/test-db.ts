import 'dotenv/config';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { nanoid } from 'nanoid';
import assert from 'node:assert/strict';

import { dynamoClient, getItem, queryItems, verifyDynamoConnection } from '../src/db/helpers.ts';
import * as schemas from '../src/db/schemas.ts';

assert.ok(await verifyDynamoConnection(), 'could not connect to DynamoDB');
console.log('verifyDynamoConnection: connected');

for (const table of Object.values(schemas)) {
    const { Table } = await dynamoClient.send(new DescribeTableCommand({ TableName: table.TableName }));
    assert.equal(Table?.TableStatus, 'ACTIVE', `table ${table.TableName} is not active`);
    assert.deepEqual(Table?.KeySchema, table.KeySchema, `table ${table.TableName} key schema differs from src/db/schemas.ts`);
    console.log(`describe ${table.TableName}: ${Table?.ItemCount ?? 0} item(s)`);
}

const missingId = nanoid();

assert.equal(await getItem(schemas.userTable, { id: missingId }), null);
console.log('getItem user: missing id returns null');

assert.equal(await getItem(schemas.songTable, { userId: missingId, id: missingId }), null);
console.log('getItem song: missing key returns null');

assert.deepEqual(await queryItems(schemas.songTable, { KeyConditionExpression: 'userId = :userId', ExpressionAttributeValues: { ':userId': missingId } }), []);
console.log('queryItems song: missing user returns no songs');

assert.deepEqual(await queryItems(schemas.userTable, { IndexName: 'email', KeyConditionExpression: 'email = :email', ExpressionAttributeValues: { ':email': `${missingId}@example.com` } }), []);
console.log('queryItems user by email index: missing email returns no users');

assert.deepEqual(await queryItems(schemas.sessionTable, { IndexName: 'token', KeyConditionExpression: '#token = :token', ExpressionAttributeNames: { '#token': 'token' }, ExpressionAttributeValues: { ':token': missingId } }), []);
console.log('queryItems session by token index: missing token returns no sessions');

console.log('All DB checks passed');
