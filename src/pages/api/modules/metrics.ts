import { z } from 'zod';
import { clientMetricSchema } from '@/db/validations';
import { getMetricsReport, recordMetric } from '@/lib/metrics';
import { getServerError } from '@/lib/status-responses';

import type { APIContext } from 'astro';

function json(body: object, status: number): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// GET /api/modules/metrics - The aggregate numbers for the Metrics section of the spec. Counts only, no song content
export const GET = async ({ locals }: APIContext): Promise<Response> => {
    if (!locals.user) return json({ error: 'Unauthorized' }, 401);

    try {
        return json({ data: await getMetricsReport() }, 200);
    } catch (error) {
        console.error('GET /api/modules/metrics error:', error);
        return getServerError();
    }
};

// POST /api/modules/metrics - Record one event from the browser. The ids are random and not linked to the account
export const POST = async ({ locals, request }: APIContext): Promise<Response> => {
    if (!locals.user) return json({ error: 'Unauthorized' }, 401);

    try {
        const { name, sessionId, clientId } = clientMetricSchema.parse(await request.json());

        await recordMetric(name, { sessionId, clientId });
        return new Response(null, { status: 204 });
    } catch (error) {
        if (error instanceof z.ZodError) return json({ error: 'Validation error', details: error.errors }, 400);

        console.error('POST /api/modules/metrics error:', error);
        return getServerError();
    }
};
