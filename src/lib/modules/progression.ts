import type { Song } from '@/db/types';
import { generateText } from '@/lib/bedrock';
import { getSong, setSong } from '@/lib/songs';

type Section = Song['sections'][number];

export async function getProgression(userId: string, songId: string, sectionId: string): Promise<Section | null> {
    const song = await getSong(userId, songId);
    if (!song) return null;

    for (const section of song.sections) {
        if (section.id === sectionId) return section;
    }

    return null;
}

export async function setProgression(userId: string, songId: string, key: string, tempo: number, progression: Section): Promise<void> {
    const song = await getSong(userId, songId);
    if (!song) return;

    const sections: Section[] = [];
    let found = false;

    for (const section of song.sections) {
        if (section.id !== progression.id) {
            sections.push(section);
            continue;
        }

        sections.push({ ...section, name: progression.name, bars: progression.bars, chords: progression.chords });
        found = true;
    }

    if (!found) sections.push(progression);

    await setSong({ ...song, key, tempo, sections, updatedAt: new Date().toISOString() });
}

export async function deleteProgression(userId: string, songId: string, sectionId: string): Promise<void> {
    const song = await getSong(userId, songId);
    if (!song) return;

    const sections: Section[] = [];

    for (const section of song.sections) {
        if (section.id !== sectionId) sections.push(section);
    }

    await setSong({ ...song, sections, updatedAt: new Date().toISOString() });
}

export async function explainChord(key: string, chord: string, chordFunction: string): Promise<string> {
    return (await generateText({
        system: 'You explain music theory to songwriters. Explain only the facts you are given in one or two plain sentences. Never say a choice is the only correct one, and never name a real artist or song.',
        messages: [{ role: 'user', content: [{ text: `Key: ${key}. Chord: ${chord}. Function in the key: ${chordFunction}. Explain the role this chord plays in the progression.` }] }],
    })).text;
}
