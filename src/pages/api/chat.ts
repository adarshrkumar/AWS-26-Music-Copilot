import { z } from 'zod';

import type { APIRoute } from 'astro';

import { streamText } from '@/lib/bedrock';

const requestSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(['system', 'user', 'assistant']),
            content: z.string(),
        })
    ).min(1),
    system: z.string().optional(),
    modelId: z.string().optional(),
    temperature: z.number().min(0).max(1).optional().default(0.7),
    maxTokens: z.number().positive().optional().default(1000),
});

export const POST: APIRoute = async ({ request }) => {
    try {
        const { messages, system, modelId, temperature, maxTokens } = requestSchema.parse(await request.json());
        const stream = streamText({ system, prompt: messages[messages.length - 1].content, history: messages.slice(0, -1), modelId, temperature, maxTokens });
        const encoder = new TextEncoder();

        return new Response(
            new ReadableStream({
                async start(controller) {
                    try {
                        for await (const text of stream) controller.enqueue(encoder.encode(text));
                        controller.close();
                    } catch (error) {
                        controller.error(error);
                    }
                },
            }),
            {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
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

        console.error('Chat API error:', error);
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
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
