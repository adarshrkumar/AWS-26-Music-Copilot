import { nanoid } from 'nanoid';
import { z } from 'zod';
import { dataTable } from '@/db';
import { deleteItem, getItem, putItem, queryItems } from '@/db/helpers';
import type { Post } from '@/db/schema';
import {
    createPostSchema,
    updatePostSchema,
    postQuerySchema,
    type CreatePostInput,
    type UpdatePostInput,
} from '@/db/validations';

import type { APIRoute } from 'astro';

// Demonstrates CRUD operations with DynamoDB, Zod validation, and NanoID

async function getPost(id: string): Promise<Post | null> {
    return getItem(dataTable, { pk: 'POST', sk: id });
}

// GET /api/posts - List posts with pagination and filtering
export const GET: APIRoute = async ({ url }) => {
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

        // DynamoDB has no ILIKE or ORDER BY on non-key attributes, so filtering, search and sorting happen here
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
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
};

// POST /api/posts - Create a new post
export const POST: APIRoute = async ({ request }) => {
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

        await putItem(dataTable, newPost);

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
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
};

// PUT /api/posts - Update an existing post
export const PUT: APIRoute = async ({ request }) => {
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

        await putItem(dataTable, updatedPost);

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
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
};

// DELETE /api/posts - Delete a post
export const DELETE: APIRoute = async ({ url }) => {
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

        // Validate ID format (NanoID is 21 characters)
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
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
};
