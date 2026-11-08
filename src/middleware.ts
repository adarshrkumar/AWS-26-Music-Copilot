import { defineMiddleware } from 'astro:middleware';
import auth from '@/lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
    const status = await auth.api.getSession({ headers: context.request.headers });
    if (status) Object.assign(context.locals, status);
    return next();
});
