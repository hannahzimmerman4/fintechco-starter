// Fails if any .claude/skills/*/SKILL.md is missing required frontmatter
// or has a description that doesn't say when the skill should be used.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = '.claude/skills';
const errors = [];
const dirs = existsSync(root)
  ? readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())
  : [];

for (const dir of dirs) {
  const file = join(root, dir.name, 'SKILL.md');
  if (!existsSync(file)) {
    errors.push(`${dir.name}: missing SKILL.md`);
    continue;
  }
  const match = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    errors.push(`${file}: missing frontmatter`);
    continue;
  }
  const field = (key) => match[1].match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim();
  const name = field('name');
  const description = field('description');
  if (name !== dir.name) errors.push(`${file}: name "${name}" must match folder "${dir.name}"`);
  if (!description) errors.push(`${file}: missing description`);
  else if (!/\buse (when|before|after|for)\b/i.test(description))
    errors.push(`${file}: description must say when to use it ("Use when/before ...")`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`skills ok (${dirs.length})`);
