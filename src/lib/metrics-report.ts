import type { MetricEvent, MetricsReport } from '@/db/types';

function share(part: number, whole: number): number | null {
    return whole === 0 ? null : part / whole;
}

function median(values: number[]): number | null {
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function keepEarliest(times: Map<string, number>, sessionId: string, time: number): void {
    const existing = times.get(sessionId);
    if (existing === undefined || time < existing) times.set(sessionId, time);
}

export function buildMetricsReport(events: MetricEvent[], generatedAt = new Date().toISOString()): MetricsReport {
    const startedSessions = new Set<string>();
    const savedSessions = new Set<string>();
    const devices = new Set<string>();
    const openers = new Set<string>();
    const firstChords = new Map<string, number>();
    const firstScales = new Map<string, number>();
    let shown = 0;
    let accepted = 0;
    let rejected = 0;

    for (const event of events) {
        const time = Date.parse(event.at);

        if (event.name === 'suggestion_shown') shown += event.count;
        if (event.name === 'suggestion_accepted') accepted += event.count;
        if (event.name === 'suggestion_rejected') rejected += event.count;

        if (event.name === 'session_start') {
            if (event.sessionId) startedSessions.add(event.sessionId);
            if (event.clientId) devices.add(event.clientId);
        }

        if (event.name === 'progression_saved' && event.sessionId) savedSessions.add(event.sessionId);
        if (event.name === 'reason_opened' && event.clientId) openers.add(event.clientId);
        if (event.name === 'first_chord' && event.sessionId && !Number.isNaN(time)) keepEarliest(firstChords, event.sessionId, time);
        if (event.name === 'first_scale_view' && event.sessionId && !Number.isNaN(time)) keepEarliest(firstScales, event.sessionId, time);
    }

    const savedAndStarted = [...savedSessions].filter(sessionId => startedSessions.has(sessionId)).length;
    const openedAndKnown = [...openers].filter(clientId => devices.has(clientId)).length;
    const seconds: number[] = [];

    for (const [sessionId, chordTime] of firstChords) {
        const scaleTime = firstScales.get(sessionId);
        if (scaleTime !== undefined && scaleTime >= chordTime) seconds.push((scaleTime - chordTime) / 1000);
    }

    return {
        generatedAt,
        progressionsBuilt: { sessions: startedSessions.size, savedSessions: savedAndStarted, share: share(savedAndStarted, startedSessions.size) },
        suggestionsAccepted: { shown, accepted, rejected, share: share(accepted, shown) },
        theoryChecks: { devices: devices.size, openedReason: openedAndKnown, share: share(openedAndKnown, devices.size) },
        timeToFirstScale: { sessions: seconds.length, medianSeconds: median(seconds) },
    };
}
