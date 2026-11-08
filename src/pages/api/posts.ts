import { nanoid } from 'nanoid';
import { z } from 'zod';
import { deleteItem, getItem, queryItems, setItem } from '@/db/helpers';
import { dataTable } from '@/db/schemas';
import type { Post } from '@/db/types';
import {
    createPostSchema,
    updatePostSchema,
    postQuerySchema,
    type CreatePostInput,
    type UpdatePostInput,
} from '@/db/validations';
import { getServerError } from '@/lib/status-responses';

import type { APIContext } from 'astro';

async function getPost(id: string): Promise<Post | null> {
    return getItem(dataTable, { pk: 'POST', sk: id });
}

export async function GET({ url }: APIContext): Promise<Response> {
    try {
        const validated = postQuerySchema.parse({
            page: url.searchParams.get('page'),
            limit: url.searchParams.get('limit'),
            published: url.searchParams.get('published'),
            featured: url.searchParams.get('featured'),
            authorId: url.searchParams.get('authorId'),
            search: url.searchParams.get('search'),
        });
        const offset = (validated.page - 1) * validated.limit;
        const search = validated.search?.toLowerCase();

        const results = (await queryItems(dataTable, {
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: { ':pk': 'POST' },
        }))
            .filter((post: Post) =>
                (validated.published === undefined || post.published === validated.published)
                && (validated.featured === undefined || post.featured === validated.featured)
                && (!validated.authorId || post.authorId === validated.authorId)
                && (!search || post.title.toLowerCase().includes(search) || post.content.toLowerCase().includes(search))
            )
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(offset, offset + validated.limit);

        return new Response(
            JSON.stringify({
                data: results,
                meta: {
                    page: validated.page,
                    limit: validated.limit,
                    total: results.length,
                },
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response(
                JSON.stringify({
                    error: 'Validation error',
                    details: error.errors,
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        console.error('GET /api/posts error:', error);
        return getServerError();
    }
}

export async function POST({ request }: APIContext): Promise<Response> {
    try {
        const validated: CreatePostInput = createPostSchema.parse(await request.json());

        const id = nanoid();
        const now = new Date().toISOString();
        const newPost: Post = {
            ...validated,
            pk: 'POST',
            sk: id,
            id,
            createdAt: now,
            updatedAt: now,
            publishedAt: validated.published ? now : null,
        };

        await setItem(dataTable, newPost);

        return new Response(
            JSON.stringify({
                data: newPost,
                message: 'Post created successfully',
            }),
            {
                status: 201,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response(
                JSON.stringify({
                    error: 'Validation error',
                    details: error.errors,
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        console.error('POST /api/posts error:', error);
        return getServerError();
    }
}

export async function PUT({ request }: APIContext): Promise<Response> {
    try {
        const { id, ...updateData }: UpdatePostInput = updatePostSchema.parse(await request.json());

        if (!id) {
            return new Response(
                JSON.stringify({
                    error: 'Post ID is required',
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        const existingPost = await getPost(id);

        if (!existingPost) {
            return new Response(
                JSON.stringify({
                    error: 'Post not found',
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        const now = new Date().toISOString();
        const updatedPost: Post = {
            ...existingPost,
            ...updateData,
            updatedAt: now,
            publishedAt:
                updateData.published !== undefined
                    ? updateData.published
                        ? now
                        : null
                    : existingPost.publishedAt,
        };

        await setItem(dataTable, updatedPost);

        return new Response(
            JSON.stringify({
                data: updatedPost,
                message: 'Post updated successfully',
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response(
                JSON.stringify({
                    error: 'Validation error',
                    details: error.errors,
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        console.error('PUT /api/posts error:', error);
        return getServerError();
    }
}

export async function DELETE({ url }: APIContext): Promise<Response> {
    try {
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response(
                JSON.stringify({
                    error: 'Post ID is required',
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        if (id.length !== 21) {
            return new Response(
                JSON.stringify({
                    error: 'Invalid post ID format',
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        if (!(await getPost(id))) {
            return new Response(
                JSON.stringify({
                    error: 'Post not found',
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        await deleteItem(dataTable, { pk: 'POST', sk: id });

        return new Response(
            JSON.stringify({
                message: 'Post deleted successfully',
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        console.error('DELETE /api/posts error:', error);
        return getServerError();
    }
}
