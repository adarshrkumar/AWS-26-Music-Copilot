export function getUnauthorizedError(message?: string): Response {
    return new Response(
        JSON.stringify({
            error: 'Unauthorized',
            message,
        }),
        {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
}

export function getServerError(message?: string): Response {
    return new Response(
        JSON.stringify({
            error: 'Internal server error',
            message,
        }),
        {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
}
