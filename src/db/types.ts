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
