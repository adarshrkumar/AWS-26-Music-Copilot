import auth from '@/lib/auth';

export async function getStatus(request: Request): Promise<boolean> {
    return !!(await auth.api.getSession({ headers: request.headers }));
}
