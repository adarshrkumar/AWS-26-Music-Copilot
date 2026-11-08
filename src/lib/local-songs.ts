import { nanoid } from 'nanoid';
import type { LocalSong } from '@/db/types';
import { localSongsSchema } from '@/db/validations';
import type { SongFormInput } from '@/db/validations';

const storageKey = 'tonepilot:songs';
const backupKey = 'tonepilot:songs:backup';

export function getLocalSongs(): LocalSong[] {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];

    try {
        const parsed = localSongsSchema.safeParse(JSON.parse(raw));
        if (parsed.success) return parsed.data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch {
        // Fall through to the backup below, the stored text is not valid JSON
    }

    localStorage.setItem(backupKey, raw);
    return [];
}

export function getLocalSong(id: string): LocalSong | null {
    return getLocalSongs().find(song => song.id === id) ?? null;
}

function saveLocalSongs(songs: LocalSong[]): void {
    localStorage.setItem(storageKey, JSON.stringify(songs));
}

export function createLocalSong(form: SongFormInput): LocalSong {
    const now = new Date().toISOString();
    const song: LocalSong = {
        id: nanoid(),
        ...form,
        sampleProgressionId: null,
        melodyShared: false,
        sections: [],
        suggestions: [],
        createdAt: now,
        updatedAt: now,
        syncedAt: null,
    };

    saveLocalSongs([...getLocalSongs(), song]);
    return song;
}

export function updateLocalSong(id: string, form: SongFormInput): LocalSong | null {
    const songs = getLocalSongs();
    const index = songs.findIndex(song => song.id === id);
    if (index === -1) return null;

    const song: LocalSong = { ...songs[index], ...form, updatedAt: new Date().toISOString() };
    songs[index] = song;
    saveLocalSongs(songs);
    return song;
}

export function markLocalSongSynced(id: string, syncedAt: string | null): LocalSong | null {
    const songs = getLocalSongs();
    const index = songs.findIndex(song => song.id === id);
    if (index === -1) return null;

    const song: LocalSong = { ...songs[index], syncedAt };
    songs[index] = song;
    saveLocalSongs(songs);
    return song;
}

export function deleteLocalSong(id: string): void {
    saveLocalSongs(getLocalSongs().filter(song => song.id !== id));
}

export function hasUnsyncedChanges(song: LocalSong): boolean {
    return song.syncedAt !== null && song.updatedAt > song.syncedAt;
}
