import { betterAuth } from 'better-auth';
import { deleteUserClasses } from '@/lib/classes';
import { deleteSongs } from '@/lib/songs';
import { dynamoAdapter } from '@/lib/auth/adapter';

export default betterAuth({
    database: dynamoAdapter,
    secret: process.env.BETTER_AUTH_SECRET || import.meta.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || import.meta.env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true },
    user: {
        deleteUser: {
            enabled: true,
            beforeDelete: async user => {
                await deleteSongs(user.id);
                await deleteUserClasses(user.id);
            },
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET || '',
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || import.meta.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || import.meta.env.GITHUB_CLIENT_SECRET || '',
        },
    },
});
