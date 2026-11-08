// DynamoDB single-table items: every post is stored with pk "POST" and sk set to the post's NanoID, so all posts can be read with one query.

export interface Post {
    pk: 'POST';
    sk: string;
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string | null;
    authorId: string;
    authorName?: string | null;
    published: boolean;
    featured: boolean;
    metaTitle?: string | null;
    metaDescription?: string | null;
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
}

export interface Song {
    userId: string;
    id: string;
    title: string;
    key: string;
    tempo: number;
    sampleProgressionId: string | null;
    melodyShared: boolean;
    sections: {
        id: string;
        name: string;
        bars: number;
        chords: { bar: number; beat: number; name: string }[];
        notes: { bar: number; beat: number; duration: number; pitch: string; string: number | null; fret: number | null }[];
    }[];
    suggestions: {
        id: string;
        sectionId: string;
        bar: number;
        kind: 'scale' | 'arpeggio' | 'chord' | 'note' | 'phrase';
        value: string;
        reason: string;
        status: 'pending' | 'accepted' | 'rejected';
        createdAt: string;
    }[];
    createdAt: string;
    updatedAt: string;
}

export interface ClassRoom {
    teacherId: string;
    id: string;
    name: string;
    joinCode: string;
    sampleProgressionIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ClassMember {
    classId: string;
    studentId: string;
    joinedAt: string;
}

export interface StudentSongReport {
    title: string;
    sampleProgressionId: string | null;
    acceptedCount: number;
    totalCount: number;
    melody: Song['sections'] | null;
}

export interface StudentReport {
    studentId: string;
    studentName: string;
    songs: StudentSongReport[];
}

export interface TeachingClass {
    id: string;
    name: string;
    joinCode: string;
    sampleProgressionIds: string[];
    students: StudentReport[];
}

export interface JoinedClass {
    id: string;
    name: string;
    teacherName: string;
    sampleProgressionIds: string[];
}

export interface TeacherData {
    teaching: TeachingClass[];
    joined: JoinedClass[];
}

export interface ApiProblem {
    error?: string;
}

export interface Comment {
    pk: `POST#${string}`;
    sk: `COMMENT#${string}`;
    id: string;
    postId: string;
    content: string;
    authorId: string;
    authorName?: string | null;
    approved: boolean;
    flagged: boolean;
    createdAt: string;
    updatedAt: string;
}
