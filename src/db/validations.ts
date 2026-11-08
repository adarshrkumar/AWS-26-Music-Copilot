import { z } from 'zod';

const slugSchema = z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug must be 255 characters or less')
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must be lowercase alphanumeric with hyphens only'
    );

export const createPostSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(255, 'Title must be 255 characters or less')
        .trim(),

    slug: slugSchema,

    content: z
        .string()
        .min(1, 'Content is required')
        .max(50000, 'Content must be 50,000 characters or less'),

    excerpt: z
        .string()
        .max(500, 'Excerpt must be 500 characters or less')
        .optional()
        .nullable(),

    authorId: z.string().min(1, 'Author ID is required'),

    authorName: z
        .string()
        .max(255, 'Author name must be 255 characters or less')
        .optional()
        .nullable(),

    published: z.boolean().default(false),

    featured: z.boolean().default(false),

    metaTitle: z
        .string()
        .max(255, 'Meta title must be 255 characters or less')
        .optional()
        .nullable(),

    metaDescription: z
        .string()
        .max(500, 'Meta description must be 500 characters or less')
        .optional()
        .nullable(),
});

export const updatePostSchema = createPostSchema.partial().extend({
    id: z.string().length(21, 'Invalid post ID'),
});

export const publishPostSchema = z.object({
    id: z.string().length(21, 'Invalid post ID'),
    published: z.boolean(),
});

export const postQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    published: z
        .string()
        .transform(val => val === 'true')
        .optional(),
    featured: z
        .string()
        .transform(val => val === 'true')
        .optional(),
    authorId: z.string().optional(),
    search: z.string().optional(),
});

export const createCommentSchema = z.object({
    postId: z.string().length(21, 'Invalid post ID'),

    content: z
        .string()
        .min(1, 'Comment content is required')
        .max(2000, 'Comment must be 2,000 characters or less')
        .trim(),

    authorId: z.string().min(1, 'Author ID is required'),

    authorName: z
        .string()
        .max(255, 'Author name must be 255 characters or less')
        .optional()
        .nullable(),
});

export const updateCommentSchema = z.object({
    id: z.string().length(21, 'Invalid comment ID'),
    content: z
        .string()
        .min(1, 'Comment content is required')
        .max(2000, 'Comment must be 2,000 characters or less')
        .trim(),
});

export const moderateCommentSchema = z.object({
    id: z.string().length(21, 'Invalid comment ID'),
    approved: z.boolean().optional(),
    flagged: z.boolean().optional(),
});

export const commentQuerySchema = z.object({
    postId: z.string().length(21, 'Invalid post ID').optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    approved: z
        .string()
        .transform(val => val === 'true')
        .optional(),
    authorId: z.string().optional(),
});

const chordSchema = z.object({
    bar: z.number().int().min(1).max(16),
    beat: z.number().min(1).max(16),
    name: z.string().min(1).max(32),
});

const noteSchema = z.object({
    bar: z.number().int().min(1).max(16),
    beat: z.number().min(1).max(16),
    duration: z.number().positive().max(64),
    pitch: z.string().min(1).max(8),
    string: z.number().int().min(1).max(12).nullable(),
    fret: z.number().int().min(0).max(36).nullable(),
});

const sectionSchema = z.object({
    id: z.string().min(1).max(40),
    name: z.string().min(1).max(80),
    bars: z.number().int().min(1, 'A section needs at least one bar').max(16, 'A section holds up to sixteen bars'),
    chords: z.array(chordSchema).max(256),
    notes: z.array(noteSchema).max(2048),
});

const suggestionSchema = z.object({
    id: z.string().min(1).max(40),
    sectionId: z.string().min(1).max(40),
    bar: z.number().int().min(1).max(16),
    kind: z.enum(['scale', 'arpeggio', 'chord', 'note', 'phrase']),
    value: z.string().min(1).max(200),
    reason: z.string().min(1).max(500),
    status: z.enum(['pending', 'accepted', 'rejected']),
    createdAt: z.string().max(40),
});

export const songInputSchema = z.object({
    id: z.string().length(21, 'Invalid song ID'),
    title: z.string().trim().min(1, 'Title is required').max(120, 'Title must be 120 characters or less'),
    key: z.string().trim().min(1, 'Key is required').max(16),
    tempo: z.number().int().min(20, 'Tempo must be at least 20 BPM').max(300, 'Tempo must be 300 BPM or less'),
    sampleProgressionId: z.string().max(40).nullable(),
    melodyShared: z.boolean(),
    sections: z.array(sectionSchema).max(20),
    suggestions: z.array(suggestionSchema).max(500),
    createdAt: z.string().max(40),
    updatedAt: z.string().max(40),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PublishPostInput = z.infer<typeof publishPostSchema>;
export type PostQueryInput = z.infer<typeof postQuerySchema>;

export type SongInput = z.infer<typeof songInputSchema>;

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type ModerateCommentInput = z.infer<typeof moderateCommentSchema>;
export type CommentQueryInput = z.infer<typeof commentQuerySchema>;

const editorNoteSchema = z.object({
    bar: z.number().int().min(1).max(16),
    beat: z.number().min(1).lt(5),
    duration: z.number().min(0.25).max(4),
    pitch: z.string().regex(/^[A-G][#b]?-?\d$/),
    string: z.number().int().min(1).max(6).nullable(),
    fret: z.number().int().min(0).max(24).nullable(),
});

export const sectionQuerySchema = z.object({
    songId: z.string().min(1),
    sectionId: z.string().min(1),
});

export const saveNotesSchema = sectionQuerySchema.extend({
    notes: z.array(editorNoteSchema).max(512),
});

export type SaveNotesInput = z.infer<typeof saveNotesSchema>;

export const clientMetricSchema = z.object({
    name: z.enum(['session_start', 'first_chord', 'first_scale_view', 'progression_saved', 'reason_opened']),
    sessionId: z.string().min(8).max(64),
    clientId: z.string().min(8).max(64),
});

export const metricRecordSchema = z.object({
    name: z.enum(['session_start', 'first_chord', 'first_scale_view', 'progression_saved', 'reason_opened', 'suggestion_shown', 'suggestion_accepted', 'suggestion_rejected']),
    sessionId: z.string().max(64).nullable(),
    clientId: z.string().max(64).nullable(),
    count: z.number().int().min(1).max(1000),
    at: z.string().max(40),
});

export type ClientMetricInput = z.infer<typeof clientMetricSchema>;
