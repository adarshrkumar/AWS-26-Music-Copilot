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

// Metric events hold counts and timestamps only. They never hold chords, notes or melodies, and the ids are random values that are not linked to an account.
export type ClientMetricName = 'session_start' | 'first_chord' | 'first_scale_view' | 'progression_saved' | 'reason_opened';

export type MetricName = ClientMetricName | 'suggestion_shown' | 'suggestion_accepted' | 'suggestion_rejected';

export interface MetricEvent {
    name: MetricName;
    sessionId: string | null;
    clientId: string | null;
    count: number;
    at: string;
}

export interface MetricsReport {
    generatedAt: string;
    progressionsBuilt: { sessions: number; savedSessions: number; share: number | null };
    suggestionsAccepted: { shown: number; accepted: number; rejected: number; share: number | null };
    theoryChecks: { devices: number; openedReason: number; share: number | null };
    timeToFirstScale: { sessions: number; medianSeconds: number | null };
}
