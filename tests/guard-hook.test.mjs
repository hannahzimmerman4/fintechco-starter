// Black-box tests for the PreToolUse guard: run the hook exactly as Claude Code does.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const run = (event) => spawnSync('node', ['scripts/guard-hook.mjs'], { input: JSON.stringify(event), encoding: 'utf8' });
const write = (file_path, content) => run({ tool_name: 'Write', tool_input: { file_path, content } });
const edit = (file_path, new_string) => run({ tool_name: 'Edit', tool_input: { file_path, old_string: 'x', new_string } });

// Fake secrets are assembled at runtime so this file never contains a literal secret.
const fakeAwsKey = ['AKIA', 'Z'.repeat(16)].join('');
const fakePem = ['-----BEGIN ', 'PRIVATE KEY-----'].join('');
const fakeGithub = ['ghp', '_', 'a'.repeat(36)].join('');

describe('guard-hook: blocks unsafe writes', () => {
  it.each([
    ['raw innerHTML from data', 'el.innerHTML = `<p>${t.merchant}</p>`;'],
    ['innerHTML from the URL', 'app.innerHTML = location.hash;'],
    ['outerHTML', 'el.outerHTML = name;'],
    ['insertAdjacentHTML', "el.insertAdjacentHTML('beforeend', s);"],
    ['document.write', 'document.write(s);'],
    ['eval', 'const v = eval(input);'],
    ['new Function', "const f = new Function('return 1');"],
  ])('%s in src/', (_, code) => {
    const r = edit('/repo/src/views/x.ts', code);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/Blocked by FinTechCo guard/);
  });

  it.each([
    ['an AWS access key', `const k = '${fakeAwsKey}';`],
    ['a private key', fakePem],
    ['a GitHub token', `token=${fakeGithub}`],
  ])('%s in any file', (_, content) => {
    expect(write('/repo/README.md', content).status).toBe(2);
    expect(write('/repo/src/a.ts', content).status).toBe(2);
  });

  it('explains the safe alternative to Claude', () => {
    expect(edit('/repo/src/main.ts', 'app.innerHTML = s;').stderr).toMatch(/html`/);
  });
});

describe('guard-hook: allows safe writes', () => {
  it('allows assigning SafeHtml .value from a render call', () => {
    expect(edit('/repo/src/main.ts', 'app!.innerHTML = renderShell(route.name, renderView(route)).value;').status).toBe(0);
  });

  it('allows every existing src file as written', () => {
    const files = [...readdirSync('src').map(f => join('src', f)), ...readdirSync('src/views').map(f => join('src/views', f))].filter(f => /\.ts$/.test(f));
    for (const f of files) expect(write(join(process.cwd(), f), readFileSync(f, 'utf8')).status, f).toBe(0);
  });

  it('does not apply code rules outside src/', () => {
    expect(write('/repo/tests/x.test.ts', "expect(out).not.toContain('innerHTML = ');").status).toBe(0);
  });

  it('ignores tools that do not write files, and fails open on bad input', () => {
    expect(run({ tool_name: 'Bash', tool_input: { command: 'echo eval(1)' } }).status).toBe(0);
    expect(spawnSync('node', ['scripts/guard-hook.mjs'], { input: 'not json', encoding: 'utf8' }).status).toBe(0);
  });
});
