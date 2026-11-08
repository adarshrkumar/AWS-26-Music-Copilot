import type { Song } from '@/db/types';
import { generateText } from '@/lib/bedrock';
import { getSong, setSong } from '@/lib/songs';

type Suggestion = Song['suggestions'][number];

export async function getScaleSuggestions(userId: string, songId: string, sectionId: string, bar: number): Promise<Suggestion[]> {
    const song = await getSong(userId, songId);
    if (!song) return [];

    const suggestions: Suggestion[] = [];

    for (const suggestion of song.suggestions) {
        if (suggestion.sectionId !== sectionId || suggestion.bar !== bar) continue;
        if (suggestion.kind === 'scale' || suggestion.kind === 'arpeggio') suggestions.push(suggestion);
    }

    return suggestions;
}

export async function addScaleSuggestion(userId: string, songId: string, suggestion: Suggestion): Promise<void> {
    const song = await getSong(userId, songId);
    if (!song) return;

    await setSong({ ...song, suggestions: [...song.suggestions, suggestion], updatedAt: new Date().toISOString() });
}

export async function setScaleSuggestionStatus(userId: string, songId: string, suggestionId: string, status: Suggestion['status']): Promise<void> {
    const song = await getSong(userId, songId);
    if (!song) return;

    const suggestions: Suggestion[] = [];

    for (const suggestion of song.suggestions) {
        if (suggestion.id === suggestionId) suggestions.push({ ...suggestion, status });
        else suggestions.push(suggestion);
    }

    await setSong({ ...song, suggestions, updatedAt: new Date().toISOString() });
}

export async function explainScale(chord: string, chordFunction: string, scale: string, notes: string[]): Promise<string> {
    return (await generateText({
        system: 'You explain music theory to songwriters. Explain only the facts you are given in one or two plain sentences. Never say a choice is the only correct one, and never name a real artist or song.',
        messages: [{ role: 'user', content: [{ text: `Chord: ${chord}. Function in the key: ${chordFunction}. Scale: ${scale} (${notes.join(', ')}). Explain why this scale fits over this chord.` }] }],
    })).text;
}

export async function getScaleFeel(scale: string, notes: string[]): Promise<string> {
    return (await generateText({
        system: 'You label the mood of a musical scale. Answer with one or two words only, such as bright, dark or bluesy.',
        messages: [{ role: 'user', content: [{ text: `Scale: ${scale} (${notes.join(', ')}).` }] }],
        maxTokens: 16,
    })).text;
}
