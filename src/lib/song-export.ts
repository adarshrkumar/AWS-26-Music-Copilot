import type { LocalSong, SongExport } from '@/db/types';

export function buildSongExport(songs: LocalSong[], includeMelody: boolean): SongExport {
    return {
        format: 'tonepilot-songs',
        version: 1,
        exportedAt: new Date().toISOString(),
        includesMelody: includeMelody,
        songs: songs.map(song => ({
            title: song.title,
            key: song.key,
            tempo: song.tempo,
            sections: song.sections.map(({ notes, ...section }) => (includeMelody ? { ...section, notes } : section)),
        })),
    };
}

export function downloadSongExport(songs: LocalSong[], includeMelody: boolean): void {
    const blob = new Blob([JSON.stringify(buildSongExport(songs, includeMelody), null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `tonepilot-songs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
