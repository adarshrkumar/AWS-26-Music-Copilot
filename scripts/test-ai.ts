import 'dotenv/config';
import assert from 'node:assert/strict';
import { z } from 'zod/v4';

import { generateObject, generateText, generateTitle, streamText } from '../src/lib/bedrock.ts';

const plain = await generateText({
    messages: [{ role: 'user', content: [{ text: 'Reply with the single word "ready" and nothing else.' }] }],
    maxTokens: 20,
    temperature: 0,
});
assert.match(plain.text.toLowerCase(), /ready/);
console.log(`generateText: ${plain.text}`);

const withTool = await generateText({
    system: 'Use the get_scale tool to answer.',
    messages: [{ role: 'user', content: [{ text: 'What notes are in the C major scale?' }] }],
    maxTokens: 200,
    temperature: 0,
    tools: [{
        spec: {
            name: 'get_scale',
            description: 'Returns the notes of a major scale.',
            inputSchema: { json: { type: 'object', properties: { root: { type: 'string' } }, required: ['root'] } },
        },
        execute: async () => 'C, D, E, F, G, A, B',
    }],
});
assert.ok(withTool.toolCallLog.length > 0, 'model did not call the tool');
assert.equal(withTool.toolCallLog[0].status, 'success');
console.log(`generateText with tool: ${withTool.toolCallLog.length} tool call(s), answer: ${withTool.text}`);

let streamed = '';
for await (const chunk of streamText({
    messages: [{ role: 'user', content: [{ text: 'Count from 1 to 5, separated by spaces.' }] }],
    maxTokens: 30,
    temperature: 0,
})) streamed += chunk;
assert.match(streamed, /1.*2.*3.*4.*5/s);
console.log(`streamText: ${streamed}`);

const triad = await generateObject({
    messages: [{ role: 'user', content: [{ text: 'Give the root and the notes of the C major triad.' }] }],
    maxTokens: 200,
    temperature: 0,
    schema: z.object({ root: z.string(), notes: z.array(z.string()) }),
});
assert.equal(triad.root, 'C');
assert.deepEqual(triad.notes, ['C', 'E', 'G']);
console.log(`generateObject: ${JSON.stringify(triad)}`);

const title = await generateTitle([
    { role: 'user', content: [{ text: 'Which scale fits a G7 chord?' }] },
    { role: 'assistant', content: [{ text: 'G Mixolydian fits G7: G, A, B, C, D, E, F.' }] },
]);
assert.ok(title.trim().length > 0, 'empty title');
console.log(`generateTitle: ${title}`);

console.log('All AI checks passed');
