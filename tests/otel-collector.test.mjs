import { describe, expect, it } from 'vitest';
import { flattenLogs, flattenMetrics } from '../scripts/otel-collector.mjs';

const s = (key, v) => ({ key, value: { stringValue: v } });

describe('otel-collector', () => {
  it('flattens a Claude Code event into one readable record', () => {
    const body = { resourceLogs: [{ resource: { attributes: [s('service.name', 'claude-code')] }, scopeLogs: [{ logRecords: [{
      timeUnixNano: '1762920000000000000',
      body: { stringValue: 'claude_code.tool_decision' },
      attributes: [s('event.name', 'tool_decision'), s('tool_name', 'Bash'), s('decision', 'reject'), s('source', 'config'), { key: 'cost_usd', value: { doubleValue: 0.01 } }, { key: 'input_tokens', value: { intValue: '42' } }],
    }] }] }] };
    expect(flattenLogs(body)).toEqual([{ ts: '2025-11-12T04:00:00.000Z', event: 'tool_decision', 'event.name': 'tool_decision', tool_name: 'Bash', decision: 'reject', source: 'config', cost_usd: 0.01, input_tokens: 42, service: 'claude-code' }]);
  });
  it('flattens metric data points', () => {
    const body = { resourceMetrics: [{ scopeMetrics: [{ metrics: [{ name: 'claude_code.token.usage', unit: 'tokens', sum: { dataPoints: [{ asInt: '1200', attributes: [s('type', 'cacheRead'), s('model', 'claude-opus-5-5')] }] } }] }] }] };
    expect(flattenMetrics(body)).toMatchObject([{ metric: 'claude_code.token.usage', value: 1200, unit: 'tokens', type: 'cacheRead', model: 'claude-opus-5-5' }]);
  });
  it('ignores empty payloads', () => {
    expect(flattenLogs({})).toEqual([]);
    expect(flattenMetrics({})).toEqual([]);
  });
});
