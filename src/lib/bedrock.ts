import {
    BedrockRuntimeClient,
    ConverseCommand,
    ConverseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type { Message } from '@aws-sdk/client-bedrock-runtime';

// AWS Bedrock client
// Credentials are resolved from env vars (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)
// or the default AWS provider chain. A Bedrock API key (AWS_BEARER_TOKEN_BEDROCK) also works.

const region = process.env.AWS_REGION || import.meta.env.AWS_REGION || 'us-east-1';

export const DEFAULT_MODEL_ID =
    process.env.BEDROCK_MODEL_ID ||
    import.meta.env.BEDROCK_MODEL_ID ||
    'us.anthropic.claude-3-5-haiku-20241022-v1:0';

export const bedrockClient = new BedrockRuntimeClient({ region });

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

const toBedrockMessages = (messages: ChatMessage[]): Message[] =>
    messages.map(m => ({ role: m.role, content: [{ text: m.content }] }));

type InvokeOptions = {
    system?: string;
    modelId?: string;
    maxTokens?: number;
    temperature?: number;
};

// Single request/response call
export const invokeModel = async (
    messages: ChatMessage[],
    options: InvokeOptions = {},
): Promise<string> => {
    const response = await bedrockClient.send(
        new ConverseCommand({
            modelId: options.modelId ?? DEFAULT_MODEL_ID,
            messages: toBedrockMessages(messages),
            system: options.system ? [{ text: options.system }] : undefined,
            inferenceConfig: {
                maxTokens: options.maxTokens ?? 1024,
                temperature: options.temperature ?? 0.7,
            },
        }),
    );

    return (
        response.output?.message?.content
            ?.map(block => block.text ?? '')
            .join('') ?? ''
    );
};

// Streaming call: yields text chunks as they arrive
export async function* streamModel(
    messages: ChatMessage[],
    options: InvokeOptions = {},
): AsyncGenerator<string> {
    const response = await bedrockClient.send(
        new ConverseStreamCommand({
            modelId: options.modelId ?? DEFAULT_MODEL_ID,
            messages: toBedrockMessages(messages),
            system: options.system ? [{ text: options.system }] : undefined,
            inferenceConfig: {
                maxTokens: options.maxTokens ?? 1024,
                temperature: options.temperature ?? 0.7,
            },
        }),
    );

    for await (const event of response.stream ?? []) {
        const text = event.contentBlockDelta?.delta?.text;
        if (text) {
            yield text;
        }
    }
}
