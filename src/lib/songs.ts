import { nanoid } from 'nanoid';
import { deleteItem, getItem, queryItems, setItem } from '@/db/helpers';
import { songTable } from '@/db/schemas';
import type { Song } from '@/db/types';

export async function createSong(userId: string, title: string, key: string, tempo: number, sampleProgressionId: string | null): Promise<Song> {
    const now = new Date().toISOString();
    const song: Song = { userId, id: nanoid(), title, key, tempo, sampleProgressionId, melodyShared: false, sections: [], suggestions: [], createdAt: now, updatedAt: now };

    await setItem(songTable, song);
    return song;
}

export async function getSong(userId: string, id: string): Promise<Song | null> {
    return getItem(songTable, { userId, id });
}

export async function getSongs(userId: string): Promise<Song[]> {
    return queryItems(songTable, { KeyConditionExpression: 'userId = :userId', ExpressionAttributeValues: { ':userId': userId } });
}

export async function setSong(song: Song): Promise<void> {
    await setItem(songTable, song);
}

export async function deleteSong(userId: string, id: string): Promise<void> {
    await deleteItem(songTable, { userId, id });
}

export async function deleteSongs(userId: string): Promise<void> {
    let songs = await getSongs(userId);

    while (songs.length > 0) {
        await Promise.all(songs.map(song => deleteSong(userId, song.id)));
        songs = await getSongs(userId);
    }
}
