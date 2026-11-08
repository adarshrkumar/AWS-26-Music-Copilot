import { deleteItem, getItem, queryItems, setItem } from '@/db/helpers';
import { songTable } from '@/db/schemas';
import type { Song } from '@/db/types';

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
