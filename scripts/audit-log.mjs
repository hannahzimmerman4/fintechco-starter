// PostToolUse hook: appends one JSON line per Claude Code tool call to .claude/audit.jsonl.
// Records what ran, not file contents, to keep sensitive data out of the log.
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX = 300;
const clip = (s) => (typeof s === 'string' && s.length > MAX ? `${s.slice(0, MAX)}…` : s);

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const e = JSON.parse(raw);
    const i = e.tool_input ?? {};
    const record = {
      ts: new Date().toISOString(),
      session: e.session_id,
      tool: e.tool_name,
      command: clip(i.command),
      file: i.file_path ?? i.path ?? i.notebook_path,
      pattern: clip(i.pattern),
      url: i.url,
    };
    const dir = process.env.CLAUDE_PROJECT_DIR ?? e.cwd ?? process.cwd();
    appendFileSync(join(dir, '.claude', 'audit.jsonl'), `${JSON.stringify(record)}\n`);
  } catch {
    // Never block or fail a tool call because auditing failed.
  }
});
