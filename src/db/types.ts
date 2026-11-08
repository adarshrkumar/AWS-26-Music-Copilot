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

export type SongSection = Song['sections'][number];

// A song as it is kept on the device. It has no userId, and syncedAt stays null until the songwriter chooses to sync it to their account.
export interface LocalSong extends Omit<Song, 'userId'> {
    syncedAt: string | null;
}

// The file the songwriter downloads to share progressions and, only when they tick the option, melodies. Suggestions and account fields are never included.
export interface SongExport {
    format: 'tonepilot-songs';
    version: 1;
    exportedAt: string;
    includesMelody: boolean;
    songs: {
        title: string;
        key: string;
        tempo: number;
        sections: (Omit<SongSection, 'notes'> & { notes?: SongSection['notes'] })[];
    }[];
}

export type Section = Song['sections'][number];
export type Chord = Section['chords'][number];
export type Note = Section['notes'][number];

export interface EditorData {
    songId: string;
    sectionId: string;
    key: string;
    bars: number;
    chords: Chord[];
    notes: Note[];
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
