import auth from '@/lib/auth';

import type { APIContext } from 'astro';

export function ALL({ request }: APIContext): Promise<Response> {
    return auth.handler(request);
}
