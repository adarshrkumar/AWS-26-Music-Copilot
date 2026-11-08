import { customAlphabet } from 'nanoid';
import { deleteItem, getItem, queryItems, setItem } from '@/db/helpers';
import { classMemberTable, classTable, userTable } from '@/db/schemas';
import type { ClassMember, ClassRoom, JoinedClass, StudentReport, TeachingClass } from '@/db/types';
import { getSongs } from '@/lib/songs';

const createJoinCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

async function getUserName(userId: string): Promise<string> {
    const user = await getItem(userTable, { id: userId });
    return typeof user?.name === 'string' && user.name ? user.name : 'Unknown student';
}

export async function getClass(teacherId: string, id: string): Promise<ClassRoom | null> {
    return getItem(classTable, { teacherId, id });
}

export async function getClassById(id: string): Promise<ClassRoom | null> {
    const [classRoom] = await queryItems(classTable, { IndexName: 'id', KeyConditionExpression: 'id = :id', ExpressionAttributeValues: { ':id': id } });
    return classRoom ?? null;
}

export async function getClassByJoinCode(joinCode: string): Promise<ClassRoom | null> {
    const [classRoom] = await queryItems(classTable, { IndexName: 'joinCode', KeyConditionExpression: 'joinCode = :joinCode', ExpressionAttributeValues: { ':joinCode': joinCode } });
    return classRoom ?? null;
}

export async function getClasses(teacherId: string): Promise<ClassRoom[]> {
    return queryItems(classTable, { KeyConditionExpression: 'teacherId = :teacherId', ExpressionAttributeValues: { ':teacherId': teacherId } });
}

export async function setClass(classRoom: ClassRoom): Promise<void> {
    await setItem(classTable, classRoom);
}

export async function createJoinCodeFor(): Promise<string> {
    let joinCode = createJoinCode();

    while (await getClassByJoinCode(joinCode)) joinCode = createJoinCode();
    return joinCode;
}

export async function getMembers(classId: string): Promise<ClassMember[]> {
    return queryItems(classMemberTable, { KeyConditionExpression: 'classId = :classId', ExpressionAttributeValues: { ':classId': classId } });
}

export async function getMemberships(studentId: string): Promise<ClassMember[]> {
    return queryItems(classMemberTable, { IndexName: 'studentId', KeyConditionExpression: 'studentId = :studentId', ExpressionAttributeValues: { ':studentId': studentId } });
}

export async function addMember(classId: string, studentId: string): Promise<void> {
    await setItem(classMemberTable, { classId, studentId, joinedAt: new Date().toISOString() });
}

export async function removeMember(classId: string, studentId: string): Promise<void> {
    await deleteItem(classMemberTable, { classId, studentId });
}

export async function deleteClass(teacherId: string, id: string): Promise<void> {
    const members = await getMembers(id);

    await Promise.all(members.map(member => removeMember(id, member.studentId)));
    await deleteItem(classTable, { teacherId, id });
}

// Teachers see counts and sample progressions. A student's melody is included only when the student has shared it.
async function getStudentReport(studentId: string): Promise<StudentReport> {
    const [studentName, songs] = await Promise.all([getUserName(studentId), getSongs(studentId)]);

    return {
        studentId,
        studentName,
        songs: songs.map(song => ({
            title: song.title,
            sampleProgressionId: song.sampleProgressionId,
            acceptedCount: song.suggestions.filter(suggestion => suggestion.status === 'accepted').length,
            totalCount: song.suggestions.length,
            melody: song.melodyShared ? song.sections : null,
        })),
    };
}

export async function getTeachingClasses(teacherId: string): Promise<TeachingClass[]> {
    const classes = await getClasses(teacherId);

    return Promise.all(
        classes.map(async ({ id, name, joinCode, sampleProgressionIds }) => {
            const members = await getMembers(id);
            return { id, name, joinCode, sampleProgressionIds, students: await Promise.all(members.map(member => getStudentReport(member.studentId))) };
        }),
    );
}

export async function getJoinedClasses(studentId: string): Promise<JoinedClass[]> {
    const memberships = await getMemberships(studentId);
    const joined = await Promise.all(
        memberships.map(async ({ classId }) => {
            const classRoom = await getClassById(classId);
            if (!classRoom) return null;
            return { id: classRoom.id, name: classRoom.name, teacherName: await getUserName(classRoom.teacherId), sampleProgressionIds: classRoom.sampleProgressionIds };
        }),
    );

    return joined.filter(classRoom => classRoom !== null);
}

export async function deleteUserClasses(userId: string): Promise<void> {
    const [classes, memberships] = await Promise.all([getClasses(userId), getMemberships(userId)]);

    await Promise.all(classes.map(classRoom => deleteClass(userId, classRoom.id)));
    await Promise.all(memberships.map(member => removeMember(member.classId, userId)));
}
