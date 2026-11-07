import { createGateway, streamText } from 'ai';
import { z } from 'zod';

import type { APIRoute } from 'astro';

// Uses the Vercel AI Gateway - no provider-specific packages needed!
// Just pass model strings like 'openai/gpt-4o' or 'anthropic/claude-3-5-sonnet-20241022'
//
// Environment variables required:
// - AI_GATEWAY_API_KEY: Your Vercel AI Gateway API key

// Validate request schema
const requestSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string(),
        })
    ),
    model: z.string().optional().default('openai/gpt-4o'),
    temperature: z.number().min(0).max(2).optional().default(0.7),
    maxTokens: z.number().positive().optional().default(1000),
});

export const POST: APIRoute = async ({ request }) => {
    try {
        // Validate API key
        if (!import.meta.env.AI_GATEWAY_API_KEY && !process.env.AI_GATEWAY_API_KEY) {
            return new Response(
                JSON.stringify({
                    error: 'AI_GATEWAY_API_KEY is not configured',
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = requestSchema.parse(body);

        // Stream the response using Vercel AI SDK with AI Gateway
        const result = streamText({
            model: createGateway({ apiKey: import.meta.env.AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY })(validatedData.model), // Model string routed through the gateway (e.g., 'openai/gpt-4o')
            messages: validatedData.messages,
            temperature: validatedData.temperature,
            maxOutputTokens: validatedData.maxTokens,
        });

        // Return the stream response
        return result.toUIMessageStreamResponse();
    } catch (error) {
        // Handle Zod validation errors
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

        // Handle other errors
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
