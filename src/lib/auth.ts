import { betterAuth } from 'better-auth';
import { dynamoAdapter } from '@/db/auth-adapter';

export const auth = betterAuth({
    database: dynamoAdapter,
    secret: process.env.BETTER_AUTH_SECRET || import.meta.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || import.meta.env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true },
});
