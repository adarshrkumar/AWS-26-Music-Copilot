function checkName(context, node, name) {
    if (!/^is[A-Z]/.test(name)) return;

    context.report({
        node,
        message: `Function '${name}' must not start with "is". Name it 'get${name.slice(2)}' instead.`
    });
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Function names must not start with "is"; name boolean helpers get* instead',
            category: 'Stylistic Issues'
        },
        schema: []
    },
    create(context) {
        if (!context.filename.replaceAll('\\', '/').includes('/src/')) return {};

        return {
            FunctionDeclaration(node) {
                if (node.id) checkName(context, node.id, node.id.name);
            },
            VariableDeclarator(node) {
                if (node.id.type !== 'Identifier') return;
                if (node.init?.type !== 'ArrowFunctionExpression' && node.init?.type !== 'FunctionExpression') return;

                checkName(context, node.id, node.id.name);
            }
        };
    }
};
