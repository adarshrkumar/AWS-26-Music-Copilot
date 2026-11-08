export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Forbid chained promise calls (.then().then().catch().finally()) in server-side files; use async/await instead',
            category: 'Best Practices'
        },
        fixable: null,
        schema: []
    },
    create(context) {
        if (!(context.filename.includes('/pages/api/') || context.filename.includes('/modules/') || context.filename.includes('/db/') || context.filename.includes('/scripts/'))) return {};

        return {
            CallExpression(node) {
                if (node.callee.type !== 'MemberExpression') return;

                const methodName = node.callee.property?.name;
                if (!['then', 'catch', 'finally'].includes(methodName)) return;

                let current = node.callee.object;

                let chainCount = 1;
                while (current && current.type === 'CallExpression' && current.callee?.type === 'MemberExpression') {
                    const parentMethodName = current.callee.property?.name;
                    if (['then', 'catch', 'finally'].includes(parentMethodName)) {
                        chainCount++;
                        current = current.callee.object;
                    }
                    else break;
                }

                if (chainCount >= 2) {
                    context.report({
                        node,
                        message: `Promise method chains (.then().catch().finally()) are not allowed in server-side code. Use async/await instead for better readability and error handling.`
                    });
                }
            }
        };
    }
};
