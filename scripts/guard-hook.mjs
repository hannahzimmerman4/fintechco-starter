// PreToolUse hook for Edit|MultiEdit|Write: refuses unsafe code before it reaches disk,
// so Claude corrects course immediately instead of a scanner catching it later.
// Exit 2 blocks the tool call and shows stderr to Claude. This is a fast first line of defense,
// not a security boundary: CodeQL in CI is the independent check.
import { relative, sep } from 'node:path';

const CODE_RULES = [
  {
    // Allowed only when the right-hand side is a render call's SafeHtml `.value`.
    test: (line) => /\.(inner|outer)HTML\s*=/.test(line) && !/(inner|outer)HTML\s*=\s*[\w.!]+\([^;]*\)\.value\s*;?\s*$/.test(line),
    why: 'raw HTML assignment. Build markup with the html`` template from src/html.ts and assign its `.value`.',
  },
  { test: (line) => /\binsertAdjacentHTML\s*\(|\bdocument\.write(ln)?\s*\(/.test(line), why: 'raw HTML insertion. Use the html`` template and assign its `.value`.' },
  { test: (line) => /\beval\s*\(|\bnew\s+Function\s*\(/.test(line), why: 'dynamic code execution (eval / new Function) is not allowed.' },
];

const SECRET_RULES = [
  { re: /\bAKIA[0-9A-Z]{16}\b/, why: 'what looks like an AWS access key.' },
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, why: 'what looks like a private key.' },
  { re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/, why: 'what looks like a GitHub token.' },
  { re: /\bsk-ant-[A-Za-z0-9_-]{20,}/, why: 'what looks like an Anthropic API key.' },
];

function written(tool, input) {
  if (tool === 'Write') return [input.content];
  if (tool === 'Edit') return [input.new_string];
  if (tool === 'MultiEdit') return (input.edits ?? []).map((e) => e.new_string);
  return [];
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    process.exit(0); // Fail open: a malformed event must not block all editing.
  }
  const input = event.tool_input ?? {};
  const file = String(input.file_path ?? '');
  const root = process.env.CLAUDE_PROJECT_DIR ?? event.cwd ?? process.cwd();
  const rel = relative(root, file).split(sep).join('/');
  const inSrc = rel.startsWith('src/') || /(^|\/)src\//.test(file);
  const problems = [];

  for (const text of written(event.tool_name, input).filter((t) => typeof t === 'string')) {
    for (const s of SECRET_RULES) if (s.re.test(text)) problems.push(s.why);
    if (!inSrc) continue;
    text.split('\n').forEach((line, i) => {
      for (const r of CODE_RULES) if (r.test(line)) problems.push(`line ${i + 1}: ${r.why}`);
    });
  }

  if (problems.length) {
    process.stderr.write(`Blocked by FinTechCo guard (${rel || file}):\n- ${[...new Set(problems)].join('\n- ')}\n`);
    process.exit(2);
  }
  process.exit(0);
});
