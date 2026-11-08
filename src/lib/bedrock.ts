import { BedrockRuntimeClient, ConverseCommand, ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import type { ContentBlock, Message, StopReason, ToolResultBlock, ToolSpecification, ToolUseBlock } from '@aws-sdk/client-bedrock-runtime';
import { nanoid } from 'nanoid';
import { z } from 'zod/v4';

const DEFAULT_MODEL_ID = process.env.BEDROCK_MODEL_ID || import.meta.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-haiku-20241022-v1:0';

const region = process.env.AWS_REGION || import.meta.env.AWS_REGION || 'us-east-1';

const bedrockClient = new BedrockRuntimeClient({ region });

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
    messages: Message[];
    modelId?: string;
    tools?: BedrockTool[];
    maxSteps?: number;
    maxTokens?: number;
    temperature?: number;
    requestId?: string;
};

function buildRequest(options: GenerateOptions) {
    console.log(`[${options.requestId ?? nanoid()}] Bedrock request: model=${options.modelId ?? DEFAULT_MODEL_ID}, messages=${options.messages.length}, tools=${options.tools?.length ?? 0}`);

    return {
        modelId: options.modelId ?? DEFAULT_MODEL_ID,
        messages: options.messages,
        system: options.system ? [{ text: options.system }] : undefined,
        inferenceConfig: { maxTokens: options.maxTokens ?? 1024, temperature: options.temperature ?? 0.7 },
        toolConfig: options.tools?.length ? { tools: options.tools.map(tool => ({ toolSpec: tool.spec })) } : undefined,
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
    const toolCallLog: ToolCallLogEntry[] = [];
    let text = '';

    for (let step = 0; step < (options.maxSteps ?? 25); step++) {
        const response = await bedrockClient.send(new ConverseCommand(buildRequest(options)));
        const message = response.output?.message;

        if (!message) break;

        options.messages.push(message);
        text = message.content?.map(block => block.text ?? '').join('') ?? '';

        if (response.stopReason !== 'tool_use') break;

        options.messages.push({ role: 'user', content: await runTools(message.content ?? [], options.tools ?? [], toolCallLog) });
    }

    return { text, toolCallLog };
}

export async function* streamText(options: GenerateOptions): AsyncGenerator<string, ToolCallLogEntry[]> {
    const toolCallLog: ToolCallLogEntry[] = [];

    for (let step = 0; step < (options.maxSteps ?? 25); step++) {
        const response = await bedrockClient.send(new ConverseStreamCommand(buildRequest(options)));
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
        options.messages.push({ role: 'assistant', content });

        if (stopReason !== 'tool_use') break;

        options.messages.push({ role: 'user', content: await runTools(content, options.tools ?? [], toolCallLog) });
    }

    return toolCallLog;
}

export async function generateObject<T extends z.ZodType>(options: GenerateOptions & { schema: T }): Promise<z.infer<T>> {
    const response = await bedrockClient.send(new ConverseCommand({
        ...buildRequest(options),
        toolConfig: {
            tools: [{ toolSpec: { name: 'respond', description: 'Respond with the structured result.', inputSchema: { json: JSON.parse(JSON.stringify(z.toJSONSchema(options.schema))) } } }],
            toolChoice: { tool: { name: 'respond' } },
        },
    }));

    return options.schema.parse(response.output?.message?.content?.find(block => block.toolUse)?.toolUse?.input);
}

export async function generateTitle(history: Message[], modelId?: string): Promise<string> {
    return (await generateText({
        system: 'You are a helpful assistant that generates concise, descriptive titles for conversations.',
        messages: [...history, { role: 'user', content: [{ text: 'Please generate a concise title for this conversation.' }] }],
        modelId,
    })).text;
}
