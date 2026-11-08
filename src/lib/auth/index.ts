import { betterAuth } from 'better-auth';
import { deleteItem, queryItems } from '@/db/helpers';
import { classMemberTable, classTable, songTable } from '@/db/schemas';
import type { ClassMember, ClassRoom, Song } from '@/db/types';
import { dynamoAdapter } from '@/lib/auth/adapter';

export default betterAuth({
    database: dynamoAdapter,
    secret: process.env.BETTER_AUTH_SECRET || import.meta.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || import.meta.env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true },
    user: {
        deleteUser: {
            enabled: true,
            beforeDelete: async user => {
                let songs: Song[] = await queryItems(songTable, { KeyConditionExpression: 'userId = :userId', ExpressionAttributeValues: { ':userId': user.id } });

                while (songs.length > 0) {
                    await Promise.all(songs.map(song => deleteItem(songTable, { userId: user.id, id: song.id })));
                    songs = await queryItems(songTable, { KeyConditionExpression: 'userId = :userId', ExpressionAttributeValues: { ':userId': user.id } });
                }

                const [classes, memberships]: [ClassRoom[], ClassMember[]] = await Promise.all([
                    queryItems(classTable, { KeyConditionExpression: 'teacherId = :teacherId', ExpressionAttributeValues: { ':teacherId': user.id } }),
                    queryItems(classMemberTable, { IndexName: 'studentId', KeyConditionExpression: 'studentId = :studentId', ExpressionAttributeValues: { ':studentId': user.id } }),
                ]);

                await Promise.all(classes.map(async classRoom => {
                    await Promise.all((await queryItems(classMemberTable, { KeyConditionExpression: 'classId = :classId', ExpressionAttributeValues: { ':classId': classRoom.id } })).map((member: ClassMember) => deleteItem(classMemberTable, { classId: classRoom.id, studentId: member.studentId })));
                    await deleteItem(classTable, { teacherId: user.id, id: classRoom.id });
                }));
                await Promise.all(memberships.map(member => deleteItem(classMemberTable, { classId: member.classId, studentId: user.id })));
            },
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET || '',
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || import.meta.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || import.meta.env.GITHUB_CLIENT_SECRET || '',
        },
    },
});
