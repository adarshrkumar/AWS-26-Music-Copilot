import auth from '@/lib/auth';

import type { APIContext } from 'astro';

export const ALL = ({ request }: APIContext): Promise<Response> => auth.handler(request);
