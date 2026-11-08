import { BedrockRuntimeClient, ConverseCommand, ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import type { ContentBlock, Message, StopReason, ToolResultBlock, ToolSpecification, ToolUseBlock } from '@aws-sdk/client-bedrock-runtime';
import { nanoid } from 'nanoid';
import { z } from 'zod/v4';

const DEFAULT_MODEL_ID = process.env.BEDROCK_MODEL_ID || import.meta.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-haiku-20241022-v1:0';

const region = process.env.AWS_REGION || import.meta.env.AWS_REGION || 'us-east-1';

const bedrockClient = new BedrockRuntimeClient({ region });

type ChatMessage = {
    role: NonNullable<Message['role']> | 'system';
    content: string;
};

type ToolStatus = NonNullable<ToolResultBlock['status']>;

type BedrockTool = {
    spec: ToolSpecification;
    execute: (input: ToolUseBlock['input']) => Promise<string>;
};

type ToolCallLogEntry = {
    toolName: string;
    input: ToolUseBlock['input'];
    status: ToolStatus;
    result: string;
};

type GenerateOptions = {
    system?: string;
    prompt: string;
    history?: ChatMessage[];
    modelId?: string;
    tools?: BedrockTool[];
    maxSteps?: number;
    maxTokens?: number;
    temperature?: number;
    requestId?: string;
};

function buildMessages(prompt: string, history: ChatMessage[]): Message[] {
    const messages: Message[] = history.flatMap(message => message.role === 'system' || message.content === '' ? [] : [{ role: message.role, content: [{ text: message.content }] }]);
    const last = messages.at(-1);

    if (last?.role !== 'user' || last.content?.map(block => block.text ?? '').join('') !== prompt) messages.push({ role: 'user', content: [{ text: prompt }] });

    return messages;
}

function buildRequest(options: GenerateOptions, messages: Message[], tools: BedrockTool[]) {
    const system = [options.system ?? '', ...(options.history ?? []).flatMap(message => message.role === 'system' ? [message.content] : [])].flatMap(text => text ? [{ text }] : []);

    return {
        modelId: options.modelId ?? DEFAULT_MODEL_ID,
        messages,
        system: system.length > 0 ? system : undefined,
        inferenceConfig: {
            maxTokens: options.maxTokens ?? 1024,
            temperature: options.temperature ?? 0.7,
        },
        toolConfig: tools.length > 0 ? { tools: tools.map(tool => ({ toolSpec: tool.spec })) } : undefined,
    };
}

async function runTools(content: ContentBlock[], tools: BedrockTool[], toolCallLog: ToolCallLogEntry[]): Promise<ContentBlock[]> {
    return Promise.all(content.flatMap(block => block.toolUse ? [block.toolUse] : []).map(async ({ toolUseId, name, input }) => {
        const tool = tools.find(candidate => candidate.spec.name === name);
        let result = `Unknown tool: ${name}`;
        let status: ToolStatus = 'error';

        try {
            if (tool) {
                result = await tool.execute(input);
                status = 'success';
            }
        } catch (error) {
            result = error instanceof Error ? error.message : 'Tool failed';
        }

        toolCallLog.push({ toolName: name ?? '', input, status, result });
        return { toolResult: { toolUseId, status, content: [{ text: result }] } };
    }));
}

export async function generateText(options: GenerateOptions): Promise<{ text: string; toolCallLog: ToolCallLogEntry[] }> {
    const { maxSteps = 25, requestId = nanoid() } = options;
    const messages = buildMessages(options.prompt, options.history ?? []);
    const tools = options.tools ?? [];
    const toolCallLog: ToolCallLogEntry[] = [];
    const startTime = Date.now();
    let text = '';

    console.log(`[${requestId}] Bedrock request: model=${options.modelId ?? DEFAULT_MODEL_ID}, messages=${messages.length}, tools=${tools.length}`);

    try {
        for (let step = 0; step < maxSteps; step++) {
            const response = await bedrockClient.send(new ConverseCommand(buildRequest(options, messages, tools)));
            const message = response.output?.message;

            if (!message) break;

            messages.push(message);
            text = message.content?.map(block => block.text ?? '').join('') ?? '';

            if (response.stopReason !== 'tool_use') break;

            messages.push({ role: 'user', content: await runTools(message.content ?? [], tools, toolCallLog) });
        }

        console.log(`[${requestId}] Bedrock response received in ${Date.now() - startTime}ms`);
        return { text, toolCallLog };
    } catch (error) {
        console.error(`[${requestId}] Bedrock generation failed after ${Date.now() - startTime}ms:`, error);
        throw error;
    }
}

export async function* streamText(options: GenerateOptions): AsyncGenerator<string, ToolCallLogEntry[]> {
    const { maxSteps = 25, requestId = nanoid() } = options;
    const messages = buildMessages(options.prompt, options.history ?? []);
    const tools = options.tools ?? [];
    const toolCallLog: ToolCallLogEntry[] = [];

    console.log(`[${requestId}] Bedrock stream request: model=${options.modelId ?? DEFAULT_MODEL_ID}, messages=${messages.length}, tools=${tools.length}`);

    for (let step = 0; step < maxSteps; step++) {
        const response = await bedrockClient.send(new ConverseStreamCommand(buildRequest(options, messages, tools)));
        const blocks = new Map<number, ContentBlock>();
        const inputs = new Map<number, string>();
        let stopReason: StopReason | undefined;

        for await (const { contentBlockStart, contentBlockDelta, messageStop } of response.stream ?? []) {
            const toolStart = contentBlockStart?.start?.toolUse;
            const index = contentBlockDelta?.contentBlockIndex ?? 0;
            const delta = contentBlockDelta?.delta;

            if (messageStop) stopReason = messageStop.stopReason;

            if (toolStart) blocks.set(contentBlockStart.contentBlockIndex ?? 0, { toolUse: { toolUseId: toolStart.toolUseId, name: toolStart.name, input: {} } });

            if (delta?.toolUse?.input) inputs.set(index, `${inputs.get(index) ?? ''}${delta.toolUse.input}`);

            if (delta?.text) {
                blocks.set(index, { text: `${blocks.get(index)?.text ?? ''}${delta.text}` });
                yield delta.text;
            }
        }

        for (const [index, input] of inputs) {
            const toolUse = blocks.get(index)?.toolUse;
            if (toolUse) toolUse.input = JSON.parse(input);
        }

        const content = [...blocks.values()];
        messages.push({ role: 'assistant', content });

        if (stopReason !== 'tool_use') break;

        messages.push({ role: 'user', content: await runTools(content, tools, toolCallLog) });
    }

    return toolCallLog;
}

export async function generateObject<T extends z.ZodType>(options: GenerateOptions & { schema: T }): Promise<z.infer<T>> {
    const { requestId = nanoid() } = options;
    const startTime = Date.now();

    console.log(`[${requestId}] Bedrock generateObject request: model=${options.modelId ?? DEFAULT_MODEL_ID}`);

    try {
        const response = await bedrockClient.send(new ConverseCommand({
            ...buildRequest(options, buildMessages(options.prompt, options.history ?? []), []),
            toolConfig: {
                tools: [{ toolSpec: { name: 'respond', description: 'Respond with the structured result.', inputSchema: { json: JSON.parse(JSON.stringify(z.toJSONSchema(options.schema))) } } }],
                toolChoice: { tool: { name: 'respond' } },
            },
        }));

        console.log(`[${requestId}] Bedrock generateObject response received in ${Date.now() - startTime}ms`);
        return options.schema.parse(response.output?.message?.content?.find(block => block.toolUse)?.toolUse?.input);
    } catch (error) {
        console.error(`[${requestId}] Bedrock generateObject failed after ${Date.now() - startTime}ms:`, error);
        throw error;
    }
}

export async function generateTitle(history: ChatMessage[], modelId?: string): Promise<string> {
    const { text } = await generateText({
        system: 'You are a helpful assistant that generates concise, descriptive titles for conversations.',
        prompt: 'Please generate a concise title for this conversation.',
        history,
        modelId,
    });

    return text;
}
