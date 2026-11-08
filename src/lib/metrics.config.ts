import type { ClientMetricName } from '@/db/types';

const clientNames: ClientMetricName[] = ['session_start', 'first_chord', 'first_scale_view', 'progression_saved', 'reason_opened'];
const oncePerSession: ClientMetricName[] = ['session_start', 'first_chord', 'first_scale_view'];

export default {
    clientKey: 'tonepilot:client',
    sessionKey: 'tonepilot:session',
    sentPrefix: 'tonepilot:metric-sent:',
    clientNames,
    oncePerSession,
};
