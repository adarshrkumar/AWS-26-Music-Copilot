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
