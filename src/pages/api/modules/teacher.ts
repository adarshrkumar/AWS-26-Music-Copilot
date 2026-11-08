import type { User } from 'better-auth';
import { customAlphabet, nanoid } from 'nanoid';
import { z } from 'zod';
import { deleteItem, getItem, queryItems, setItem } from '@/db/helpers';
import { classMemberTable, classTable, songTable, userTable } from '@/db/schemas';
import type { ClassMember, ClassRoom, Song } from '@/db/types';
import { classIdSchema, classInputSchema, joinClassSchema } from '@/db/validations';
import { getServerError, getUnauthorizedError } from '@/lib/status-responses';
import { SAMPLE_PROGRESSIONS } from '@/lib/theory/samples';

import type { APIContext } from 'astro';

const classBodySchema = classInputSchema.refine(input => input.sampleProgressionIds.every(id => SAMPLE_PROGRESSIONS.some(progression => progression.id === id)), { message: 'Choose sample progressions from the list', path: ['sampleProgressionIds'] });

const createJoinCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

export const GET = async ({ locals }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    try {
        const [classes, memberships]: [ClassRoom[], ClassMember[]] = await Promise.all([
            queryItems(classTable, { KeyConditionExpression: 'teacherId = :teacherId', ExpressionAttributeValues: { ':teacherId': locals.user.id } }),
            queryItems(classMemberTable, { IndexName: 'studentId', KeyConditionExpression: 'studentId = :studentId', ExpressionAttributeValues: { ':studentId': locals.user.id } }),
        ]);

        return new Response(JSON.stringify({
            data: {
                teaching: await Promise.all(classes.map(async ({ id, name, joinCode, sampleProgressionIds }) => ({
                    id,
                    name,
                    joinCode,
                    sampleProgressionIds,
                    students: await Promise.all((await queryItems(classMemberTable, { KeyConditionExpression: 'classId = :classId', ExpressionAttributeValues: { ':classId': id } })).map(async ({ studentId }: ClassMember) => {
                        const [student, songs]: [User | null, Song[]] = await Promise.all([getItem(userTable, { id: studentId }), queryItems(songTable, { KeyConditionExpression: 'userId = :userId', ExpressionAttributeValues: { ':userId': studentId } })]);

                        return {
                            studentId,
                            studentName: student?.name || 'Unknown student',
                            songs: songs.map(song => ({
                                title: song.title,
                                sampleProgressionId: song.sampleProgressionId,
                                acceptedCount: song.suggestions.filter(suggestion => suggestion.status === 'accepted').length,
                                totalCount: song.suggestions.length,
                                melody: song.melodyShared ? song.sections : null,
                            })),
                        };
                    })),
                }))),
                joined: (await Promise.all(memberships.map(async ({ classId }) => {
                    const [classRoom]: ClassRoom[] = await queryItems(classTable, { IndexName: 'id', KeyConditionExpression: 'id = :id', ExpressionAttributeValues: { ':id': classId } });
                    if (!classRoom) return null;

                    const teacher: User | null = await getItem(userTable, { id: classRoom.teacherId });
                    return { id: classRoom.id, name: classRoom.name, teacherName: teacher?.name || 'Unknown teacher', sampleProgressionIds: classRoom.sampleProgressionIds };
                }))).filter(classRoom => classRoom !== null),
            },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('GET /api/modules/teacher error:', error);
        return getServerError();
    }
};

export const POST = async ({ locals, request }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    try {
        const body = z.discriminatedUnion('action', [z.object({ action: z.literal('create') }).merge(classInputSchema), z.object({ action: z.literal('join') }).merge(joinClassSchema)]).parse(await request.json());

        if (body.action === 'join') {
            const [classRoom]: ClassRoom[] = await queryItems(classTable, { IndexName: 'joinCode', KeyConditionExpression: 'joinCode = :joinCode', ExpressionAttributeValues: { ':joinCode': body.joinCode } });
            if (!classRoom) return new Response(JSON.stringify({ error: 'No class has that join code' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            if (classRoom.teacherId === locals.user.id) return new Response(JSON.stringify({ error: 'You teach this class' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

            await setItem(classMemberTable, { classId: classRoom.id, studentId: locals.user.id, joinedAt: new Date().toISOString() });
            return new Response(JSON.stringify({ message: `Joined ${classRoom.name}` }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const input = classBodySchema.parse(body);
        let joinCode = createJoinCode();

        while ((await queryItems(classTable, { IndexName: 'joinCode', KeyConditionExpression: 'joinCode = :joinCode', ExpressionAttributeValues: { ':joinCode': joinCode } })).length > 0) joinCode = createJoinCode();

        await setItem(classTable, { teacherId: locals.user.id, id: nanoid(), name: input.name, joinCode, sampleProgressionIds: input.sampleProgressionIds, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        return new Response(JSON.stringify({ message: 'Class created' }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        if (error instanceof z.ZodError) return new Response(JSON.stringify({ error: 'Validation error', details: error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });

        console.error('POST /api/modules/teacher error:', error);
        return getServerError();
    }
};

export const PUT = async ({ locals, request, url }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    try {
        const classRoom: ClassRoom | null = await getItem(classTable, { teacherId: locals.user.id, id: classIdSchema.parse(url.searchParams.get('id')) });
        if (!classRoom) return new Response(JSON.stringify({ error: 'Class not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

        const input = classBodySchema.parse(await request.json());

        await setItem(classTable, { ...classRoom, name: input.name, sampleProgressionIds: input.sampleProgressionIds, updatedAt: new Date().toISOString() });
        return new Response(JSON.stringify({ message: 'Class saved' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        if (error instanceof z.ZodError) return new Response(JSON.stringify({ error: 'Validation error', details: error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });

        console.error('PUT /api/modules/teacher error:', error);
        return getServerError();
    }
};

export const DELETE = async ({ locals, url }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    try {
        const id = classIdSchema.parse(url.searchParams.get('id'));

        if (url.searchParams.get('as') === 'student') {
            if (!(await getItem(classMemberTable, { classId: id, studentId: locals.user.id }))) return new Response(JSON.stringify({ error: 'You are not in this class' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

            await deleteItem(classMemberTable, { classId: id, studentId: locals.user.id });
            return new Response(JSON.stringify({ message: 'Left the class' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (!(await getItem(classTable, { teacherId: locals.user.id, id }))) return new Response(JSON.stringify({ error: 'Class not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

        await Promise.all((await queryItems(classMemberTable, { KeyConditionExpression: 'classId = :classId', ExpressionAttributeValues: { ':classId': id } })).map((member: ClassMember) => deleteItem(classMemberTable, { classId: id, studentId: member.studentId })));
        await deleteItem(classTable, { teacherId: locals.user.id, id });
        return new Response(JSON.stringify({ message: 'Class deleted' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        if (error instanceof z.ZodError) return new Response(JSON.stringify({ error: 'Validation error', details: error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });

        console.error('DELETE /api/modules/teacher error:', error);
        return getServerError();
    }
};
