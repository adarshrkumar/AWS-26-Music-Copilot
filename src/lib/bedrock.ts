import {
    BedrockRuntimeClient,
    ConverseCommand,
    ConverseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type { Message } from '@aws-sdk/client-bedrock-runtime';

// Credentials are resolved from env vars (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) or the default AWS provider chain. A Bedrock API key (AWS_BEARER_TOKEN_BEDROCK) also works.

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

function toBedrockMessages(messages: ChatMessage[]): Message[] {
    return messages.map(m => ({ role: m.role, content: [{ text: m.content }] }));
}

type InvokeOptions = {
    system?: string;
    modelId?: string;
    maxTokens?: number;
    temperature?: number;
};

export async function invokeModel(
    messages: ChatMessage[],
    options: InvokeOptions = {},
): Promise<string> {
    return (
        (
            await bedrockClient.send(
                new ConverseCommand({
                    modelId: options.modelId ?? DEFAULT_MODEL_ID,
                    messages: toBedrockMessages(messages),
                    system: options.system ? [{ text: options.system }] : undefined,
                    inferenceConfig: {
                        maxTokens: options.maxTokens ?? 1024,
                        temperature: options.temperature ?? 0.7,
                    },
                }),
            )
        ).output?.message?.content
            ?.map(block => block.text ?? '')
            .join('') ?? ''
    );
}

export async function* streamModel(
    messages: ChatMessage[],
    options: InvokeOptions = {},
): AsyncGenerator<string> {
    for await (const event of (
        await bedrockClient.send(
            new ConverseStreamCommand({
                modelId: options.modelId ?? DEFAULT_MODEL_ID,
                messages: toBedrockMessages(messages),
                system: options.system ? [{ text: options.system }] : undefined,
                inferenceConfig: {
                    maxTokens: options.maxTokens ?? 1024,
                    temperature: options.temperature ?? 0.7,
                },
            }),
        )
    ).stream ?? []) {
        const text = event.contentBlockDelta?.delta?.text;
        if (text) yield text;
    }
}
