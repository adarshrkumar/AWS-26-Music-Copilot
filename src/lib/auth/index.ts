import { betterAuth } from 'better-auth';
import { dynamoAdapter } from '@/lib/auth/adapter';

export default betterAuth({
    database: dynamoAdapter,
    secret: process.env.BETTER_AUTH_SECRET || import.meta.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || import.meta.env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true },
});
