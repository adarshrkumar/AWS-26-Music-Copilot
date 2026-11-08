import type { Note, Section } from '@/db/types';
import { generateText } from '@/lib/bedrock';
import { getSong, setSong } from '@/lib/songs';

export async function getNotes(userId: string, songId: string, sectionId: string): Promise<Note[]> {
    const song = await getSong(userId, songId);
    if (!song) return [];

    for (const section of song.sections) {
        if (section.id === sectionId) return section.notes;
    }

    return [];
}

export async function setNotes(userId: string, songId: string, sectionId: string, notes: Note[]): Promise<void> {
    const song = await getSong(userId, songId);
    if (!song) return;

    const sections: Section[] = [];

    for (const section of song.sections) {
        if (section.id === sectionId) sections.push({ ...section, notes });
        else sections.push(section);
    }

    await setSong({ ...song, sections, updatedAt: new Date().toISOString() });
}

export async function explainNote(chord: string, scale: string, pitch: string, inScale: boolean): Promise<string> {
    return (await generateText({
        system: 'You explain music theory to songwriters. Explain only the facts you are given in one or two plain sentences. Never tell the songwriter to remove or change a note, never say a choice is the only correct one, and never name a real artist or song.',
        messages: [{ role: 'user', content: [{ text: `Chord: ${chord}. Scale: ${scale}. Note: ${pitch}, which is ${inScale ? 'inside' : 'outside'} the scale. Explain how this note sounds over the chord.` }] }],
    })).text;
}
