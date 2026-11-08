import { nanoid } from 'nanoid';
import { z } from 'zod';
import { classIdSchema, classInputSchema, joinClassSchema } from '@/db/validations';
import { addMember, createJoinCodeFor, deleteClass, getClass, getClassByJoinCode, getJoinedClasses, getMembers, getTeachingClasses, removeMember, setClass } from '@/lib/classes';
import { SAMPLE_PROGRESSIONS } from '@/lib/theory/samples';

import type { APIContext } from 'astro';

const knownIds = SAMPLE_PROGRESSIONS.map(progression => progression.id);

const classBodySchema = classInputSchema.refine(input => input.sampleProgressionIds.every(id => knownIds.includes(id)), { message: 'Choose sample progressions from the list', path: ['sampleProgressionIds'] });

const postBodySchema = z.discriminatedUnion('action', [z.object({ action: z.literal('create') }).merge(classInputSchema), z.object({ action: z.literal('join') }).merge(joinClassSchema)]);

function json(body: object, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function failure(method: string, error: Error | null): Response {
    if (error instanceof z.ZodError) return json({ error: 'Validation error', details: error.errors }, 400);
    console.error(`${method} /api/modules/teacher error:`, error);
    return json({ error: 'Internal server error' }, 500);
}

// GET /api/modules/teacher - Classes the signed-in user teaches, with student counts, and classes the user has joined
export async function GET({ locals }: APIContext): Promise<Response> {
    if (!locals.user) return json({ error: 'Unauthorized' }, 401);

    try {
        const [teaching, joined] = await Promise.all([getTeachingClasses(locals.user.id), getJoinedClasses(locals.user.id)]);
        return json({ data: { teaching, joined } });
    } catch (error) {
        return failure('GET', error instanceof Error ? error : null);
    }
}

// POST /api/modules/teacher - Create a class (action "create") or join one with its code (action "join"). Joining is always the student's own action
export async function POST({ locals, request }: APIContext): Promise<Response> {
    if (!locals.user) return json({ error: 'Unauthorized' }, 401);

    try {
        const body = postBodySchema.parse(await request.json());

        if (body.action === 'join') {
            const classRoom = await getClassByJoinCode(body.joinCode);
            if (!classRoom) return json({ error: 'No class has that join code' }, 404);
            if (classRoom.teacherId === locals.user.id) return json({ error: 'You teach this class' }, 400);

            await addMember(classRoom.id, locals.user.id);
            return json({ message: `Joined ${classRoom.name}` });
        }

        const input = classBodySchema.parse(body);
        const now = new Date().toISOString();

        await setClass({ teacherId: locals.user.id, id: nanoid(), name: input.name, joinCode: await createJoinCodeFor(), sampleProgressionIds: input.sampleProgressionIds, createdAt: now, updatedAt: now });
        return json({ message: 'Class created' }, 201);
    } catch (error) {
        return failure('POST', error instanceof Error ? error : null);
    }
}

// PUT /api/modules/teacher?id=... - Change a class name or its sample progressions. Only the class's teacher can do this
export async function PUT({ locals, request, url }: APIContext): Promise<Response> {
    if (!locals.user) return json({ error: 'Unauthorized' }, 401);

    try {
        const classRoom = await getClass(locals.user.id, classIdSchema.parse(url.searchParams.get('id')));
        if (!classRoom) return json({ error: 'Class not found' }, 404);

        const input = classBodySchema.parse(await request.json());

        await setClass({ ...classRoom, name: input.name, sampleProgressionIds: input.sampleProgressionIds, updatedAt: new Date().toISOString() });
        return json({ message: 'Class saved' });
    } catch (error) {
        return failure('PUT', error instanceof Error ? error : null);
    }
}

// DELETE /api/modules/teacher?id=...&as=teacher|student - A teacher deletes a class, a student leaves one
export async function DELETE({ locals, url }: APIContext): Promise<Response> {
    if (!locals.user) return json({ error: 'Unauthorized' }, 401);

    try {
        const id = classIdSchema.parse(url.searchParams.get('id'));

        if (url.searchParams.get('as') === 'student') {
            const members = await getMembers(id);
            if (!members.some(member => member.studentId === locals.user?.id)) return json({ error: 'You are not in this class' }, 404);

            await removeMember(id, locals.user.id);
            return json({ message: 'Left the class' });
        }

        if (!(await getClass(locals.user.id, id))) return json({ error: 'Class not found' }, 404);

        await deleteClass(locals.user.id, id);
        return json({ message: 'Class deleted' });
    } catch (error) {
        return failure('DELETE', error instanceof Error ? error : null);
    }
}
