import type { Chord, Note, ScaleOption } from '@/lib/theory';

export type GuideMark = 'current' | 'next' | 'both';

export interface Marker {
    name: string;
    role: 'root' | 'scale' | 'outside';
    guide: GuideMark | null;
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const WHITE_PITCHES = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEYS = [{ pitch: 1, after: 0 }, { pitch: 3, after: 1 }, { pitch: 6, after: 3 }, { pitch: 8, after: 4 }, { pitch: 10, after: 5 }];
const STRINGS = [{ label: 'e', pitch: 4 }, { label: 'B', pitch: 11 }, { label: 'G', pitch: 7 }, { label: 'D', pitch: 2 }, { label: 'A', pitch: 9 }, { label: 'E', pitch: 4 }];
const OCTAVES = 2;
const WHITE_WIDTH = 44;
const WHITE_HEIGHT = 150;
const BLACK_WIDTH = 28;
const BLACK_HEIGHT = 92;
const FRET_COUNT = 12;
const FRET_WIDTH = 62;
const NUT_WIDTH = 52;
const STRING_GAP = 32;
const FRET_TOP = 24;
const INLAYS = [3, 5, 7, 9, 12];

export function buildMarkers(option: ScaleOption, chord: Chord, next: Chord | null): Map<number, Marker> {
    const markers = new Map<number, Marker>();

    for (const note of option.notes) {
        const role = note.pitch === chord.root.pitch ? 'root' : 'scale';
        if (!markers.has(note.pitch)) markers.set(note.pitch, { name: note.name, role, guide: null });
    }

    function mark(notes: Note[], guide: 'current' | 'next'): void {
        for (const note of notes) {
            const existing = markers.get(note.pitch);

            if (!existing) {
                markers.set(note.pitch, { name: note.name, role: 'outside', guide });
                continue;
            }

            existing.guide = existing.guide && existing.guide !== guide ? 'both' : guide;
        }
    }

    mark(chord.guideTones, 'current');
    if (next) mark(next.guideTones, 'next');

    return markers;
}

export function describeMarkers(markers: Map<number, Marker>): string {
    const outside = [...markers.values()].filter(marker => marker.role === 'outside').map(marker => marker.name);
    return outside.length === 0 ? '' : ` Notes outside the scale: ${outside.join(', ')}.`;
}

function node(tag: string, attributes: Record<string, string | number>, text?: string): SVGElement {
    const element = document.createElementNS(SVG_NAMESPACE, tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value.toString());
    if (text !== undefined) element.textContent = text;
    return element;
}

function guideSymbol(guide: GuideMark | null): string {
    if (guide === 'current') return '◆';
    if (guide === 'next') return '▲';
    if (guide === 'both') return '◆▲';
    return '';
}

function markerLabel(marker: Marker): string {
    return `${marker.role === 'outside' ? '×' : ''}${marker.name}${guideSymbol(marker.guide)}`;
}

function drawMarker(parent: SVGElement, marker: Marker, x: number, y: number, radius: number): void {
    const group = node('g', { class: 'diagram__marker', 'data-role': marker.role, 'data-guide': marker.guide ?? 'none' });
    const shape = marker.role === 'root'
        ? node('rect', { x: x - radius, y: y - radius, width: radius * 2, height: radius * 2, rx: 3 })
        : node('circle', { cx: x, cy: y, r: radius });

    group.append(shape, node('text', { x, y: y + 4, 'text-anchor': 'middle' }, markerLabel(marker)));
    parent.append(group);
}

export function drawKeyboard(markers: Map<number, Marker>, description: string): SVGElement {
    const width = OCTAVES * WHITE_PITCHES.length * WHITE_WIDTH;
    const svg = node('svg', { viewBox: `0 0 ${width} ${WHITE_HEIGHT + 4}`, role: 'img', 'aria-label': description, class: 'diagram__svg' });
    const keys = node('g', {});
    const overlay = node('g', {});

    for (let octave = 0; octave < OCTAVES; octave++) {
        WHITE_PITCHES.forEach((pitch, index) => {
            const x = (octave * WHITE_PITCHES.length + index) * WHITE_WIDTH;
            const marker = markers.get(pitch);

            keys.append(node('rect', { class: 'diagram__white-key', x, y: 2, width: WHITE_WIDTH, height: WHITE_HEIGHT }));
            if (marker) drawMarker(overlay, marker, x + WHITE_WIDTH / 2, WHITE_HEIGHT - 22, 16);
        });
    }

    for (let octave = 0; octave < OCTAVES; octave++) {
        for (const black of BLACK_KEYS) {
            const x = (octave * WHITE_PITCHES.length + black.after + 1) * WHITE_WIDTH - BLACK_WIDTH / 2;
            const marker = markers.get(black.pitch);

            keys.append(node('rect', { class: 'diagram__black-key', x, y: 2, width: BLACK_WIDTH, height: BLACK_HEIGHT }));
            if (marker) drawMarker(overlay, marker, x + BLACK_WIDTH / 2, BLACK_HEIGHT - 26, 13);
        }
    }

    svg.append(keys, overlay);
    return svg;
}

export function drawFretboard(markers: Map<number, Marker>, description: string): SVGElement {
    const width = NUT_WIDTH + FRET_COUNT * FRET_WIDTH + 8;
    const height = FRET_TOP + (STRINGS.length - 1) * STRING_GAP + 40;
    const board = (STRINGS.length - 1) * STRING_GAP;
    const svg = node('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': description, class: 'diagram__svg' });
    const lines = node('g', { class: 'diagram__lines' });
    const overlay = node('g', {});

    for (let fret = 0; fret <= FRET_COUNT; fret++) {
        const x = NUT_WIDTH + fret * FRET_WIDTH;
        lines.append(node('line', { class: fret === 0 ? 'diagram__nut' : 'diagram__fret', x1: x, y1: FRET_TOP, x2: x, y2: FRET_TOP + board }));
        if (INLAYS.includes(fret)) lines.append(node('text', { class: 'diagram__fret-number', x: x - FRET_WIDTH / 2, y: FRET_TOP + board + 28, 'text-anchor': 'middle' }, fret.toString()));
    }

    STRINGS.forEach((string, index) => {
        const y = FRET_TOP + index * STRING_GAP;

        lines.append(node('line', { class: 'diagram__string', x1: NUT_WIDTH, y1: y, x2: NUT_WIDTH + FRET_COUNT * FRET_WIDTH, y2: y }));
        lines.append(node('text', { class: 'diagram__string-name', x: 6, y: y + 4 }, string.label));

        for (let fret = 0; fret <= FRET_COUNT; fret++) {
            const marker = markers.get((string.pitch + fret) % 12);
            if (!marker) continue;

            const x = fret === 0 ? NUT_WIDTH - 16 : NUT_WIDTH + (fret - 0.5) * FRET_WIDTH;
            drawMarker(overlay, marker, x, y, 13);
        }
    });

    svg.append(lines, overlay);
    return svg;
}
