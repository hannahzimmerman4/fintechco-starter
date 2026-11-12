// Minimal local OpenTelemetry (OTLP/HTTP JSON) receiver for the demo.
// Claude Code exports here; each event or metric data point becomes one readable JSON line in
// .claude/telemetry/{events,metrics}.jsonl, so you can browse them in the IDE.
// In production this is your OTel Collector feeding Datadog, Grafana, Splunk, a SIEM, etc.
import { appendFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** OTLP AnyValue → plain JS value. */
export function anyValue(v) {
  if (!v) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('boolValue' in v) return v.boolValue;
  if ('intValue' in v) return Number(v.intValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(anyValue);
  if ('kvlistValue' in v) return attrs(v.kvlistValue.values);
  return undefined;
}

export const attrs = (list = []) => Object.fromEntries(list.map((a) => [a.key, anyValue(a.value)]));
const iso = (nanos) => (nanos ? new Date(Number(BigInt(nanos) / 1000000n)).toISOString() : new Date().toISOString());

/** OTLP logs payload → one flat record per Claude Code event. */
export function flattenLogs(body) {
  const out = [];
  for (const rl of body.resourceLogs ?? []) {
    const resource = attrs(rl.resource?.attributes);
    for (const sl of rl.scopeLogs ?? []) {
      for (const r of sl.logRecords ?? []) {
        const a = attrs(r.attributes);
        out.push({ ts: iso(r.timeUnixNano), event: a['event.name'] ?? anyValue(r.body), ...a, service: resource['service.name'] });
      }
    }
  }
  return out;
}

/** OTLP metrics payload → one flat record per data point. */
export function flattenMetrics(body) {
  const out = [];
  for (const rm of body.resourceMetrics ?? []) {
    for (const sm of rm.scopeMetrics ?? []) {
      for (const m of sm.metrics ?? []) {
        const points = (m.sum ?? m.gauge ?? m.histogram)?.dataPoints ?? [];
        for (const p of points) {
          out.push({ ts: iso(p.timeUnixNano), metric: m.name, value: p.asDouble ?? (p.asInt === undefined ? p.sum : Number(p.asInt)), unit: m.unit, ...attrs(p.attributes) });
        }
      }
    }
  }
  return out;
}

function start({ port = 4318, dir = join(process.cwd(), '.claude', 'telemetry') } = {}) {
  mkdirSync(dir, { recursive: true });
  const routes = { '/v1/logs': ['events.jsonl', flattenLogs], '/v1/metrics': ['metrics.jsonl', flattenMetrics] };
  const server = createServer((req, res) => {
    const route = routes[req.url ?? ''];
    if (req.method !== 'POST' || !route) {
      res.writeHead(404).end();
      return;
    }
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        const records = route[1](JSON.parse(raw));
        if (records.length) appendFileSync(join(dir, route[0]), records.map((r) => JSON.stringify(r)).join('\n') + '\n');
        res.writeHead(200, { 'content-type': 'application/json' }).end('{}');
      } catch {
        res.writeHead(400).end(); // e.g. protobuf sent instead of http/json
      }
    });
  });
  server.listen(port, '127.0.0.1', () => console.log(`OTLP receiver on http://127.0.0.1:${port} → ${dir}`));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) start();
