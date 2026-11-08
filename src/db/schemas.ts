import type { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';

export const dataTable: CreateTableCommandInput = {
    TableName: 'data',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
        { AttributeName: 'pk', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'S' },
    ],
    KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
    ],
};

export const userTable: CreateTableCommandInput = {
    TableName: 'user',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
        { IndexName: 'email', KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }], Projection: { ProjectionType: 'ALL' } },
    ],
};

export const sessionTable: CreateTableCommandInput = {
    TableName: 'session',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'token', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
        { IndexName: 'token', KeySchema: [{ AttributeName: 'token', KeyType: 'HASH' }], Projection: { ProjectionType: 'ALL' } },
        { IndexName: 'userId', KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }], Projection: { ProjectionType: 'ALL' } },
    ],
};

export const accountTable: CreateTableCommandInput = {
    TableName: 'account',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'accountId', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
        { IndexName: 'userId', KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }], Projection: { ProjectionType: 'ALL' } },
        { IndexName: 'accountId', KeySchema: [{ AttributeName: 'accountId', KeyType: 'HASH' }], Projection: { ProjectionType: 'ALL' } },
    ],
};

export const verificationTable: CreateTableCommandInput = {
    TableName: 'verification',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'identifier', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
        { IndexName: 'identifier', KeySchema: [{ AttributeName: 'identifier', KeyType: 'HASH' }], Projection: { ProjectionType: 'ALL' } },
    ],
};

export const classTable: CreateTableCommandInput = {
    TableName: 'class',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
        { AttributeName: 'teacherId', AttributeType: 'S' },
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'joinCode', AttributeType: 'S' },
    ],
    KeySchema: [
        { AttributeName: 'teacherId', KeyType: 'HASH' },
        { AttributeName: 'id', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
        { IndexName: 'joinCode', KeySchema: [{ AttributeName: 'joinCode', KeyType: 'HASH' }], Projection: { ProjectionType: 'ALL' } },
        { IndexName: 'id', KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }], Projection: { ProjectionType: 'ALL' } },
    ],
};

export const classMemberTable: CreateTableCommandInput = {
    TableName: 'classMember',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
        { AttributeName: 'classId', AttributeType: 'S' },
        { AttributeName: 'studentId', AttributeType: 'S' },
    ],
    KeySchema: [
        { AttributeName: 'classId', KeyType: 'HASH' },
        { AttributeName: 'studentId', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
        { IndexName: 'studentId', KeySchema: [{ AttributeName: 'studentId', KeyType: 'HASH' }], Projection: { ProjectionType: 'ALL' } },
    ],
};

export const songTable: CreateTableCommandInput = {
    TableName: 'song',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'id', AttributeType: 'S' },
    ],
    KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'id', KeyType: 'RANGE' },
    ],
};
