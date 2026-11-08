import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { NativeAttributeValue } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';
import { docClient, setItem } from '@/db/helpers';
import { dataTable } from '@/db/schemas';
import type { MetricEvent, MetricName, MetricsReport, Song } from '@/db/types';
import { metricRecordSchema } from '@/db/validations';
import { buildMetricsReport } from '@/lib/metrics-report';

type SuggestionStatus = Song['suggestions'][number]['status'];

export async function recordMetric(name: MetricName, ids: { sessionId: string | null; clientId: string | null } = { sessionId: null, clientId: null }, count = 1): Promise<void> {
    const at = new Date().toISOString();

    try {
        await setItem(dataTable, { pk: 'METRIC', sk: `${at}#${nanoid()}`, name, ...ids, count, at });
    } catch (error) {
        console.error('Could not record metric:', error);
    }
}

export async function recordSuggestionStatus(status: SuggestionStatus): Promise<void> {
    if (status === 'accepted') await recordMetric('suggestion_accepted');
    if (status === 'rejected') await recordMetric('suggestion_rejected');
}

export async function getMetricEvents(): Promise<MetricEvent[]> {
    const events: MetricEvent[] = [];
    let startKey: Record<string, NativeAttributeValue> | undefined;

    do {
        const page = await docClient.send(
            new QueryCommand({
                TableName: dataTable.TableName,
                KeyConditionExpression: 'pk = :pk',
                ExpressionAttributeValues: { ':pk': 'METRIC' },
                ExclusiveStartKey: startKey,
            }),
        );

        for (const item of page.Items ?? []) {
            const parsed = metricRecordSchema.safeParse(item);
            if (parsed.success) events.push(parsed.data);
        }

        startKey = page.LastEvaluatedKey;
    } while (startKey);

    return events;
}

export async function getMetricsReport(): Promise<MetricsReport> {
    return buildMetricsReport(await getMetricEvents());
}
