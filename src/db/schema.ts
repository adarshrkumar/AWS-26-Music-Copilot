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
