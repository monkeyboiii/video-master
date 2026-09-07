// vm's own tests, run against synthetic trees in a temp directory.
//
// WHY THIS EXISTS AND NOT JUST `vm check`. Running the checker against the real repo answers "is
// the repo right", and cannot answer "is the checker right" — a checker that silently passes
// everything looks identical to a clean tree. Each case below builds a tree that is WRONG in one
// specific way and asserts the checker says so. Without it, the migration would have had no way to
// tell "green because correct" from "green because blind".
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { checkTree } from './check.mjs';

const EP = (id, extra = {}) => ({
  video_id: id, slug: 'a-slug', status: 'topic',
  formats: { primary: 'short_vertical', aspect: '9x16', resolution: '1080x1920', fps: 30 },
  variants: { 'en-US': { script: null, platforms: ['tiktok'] } },
  ...extra,
});

function build(root, spec) {
  for (const [season, eps] of Object.entries(spec.seasons)) {
    const sd = path.join(root, 'series', season);
    fs.mkdirSync(sd, { recursive: true });
    fs.writeFileSync(path.join(sd, 'README.md'),
      `# ${season}\n\n` + 'x'.repeat(220) + '\n');
    for (const [dir, m] of Object.entries(eps)) {
      const ed = path.join(sd, dir);
      fs.mkdirSync(path.join(ed, 'remotion-props'), { recursive: true });
      fs.writeFileSync(path.join(ed, 'brief.md'), '# brief\n');
      fs.writeFileSync(path.join(ed, 'manifest.yml'), YAML.stringify(m));
      for (const [f, json] of Object.entries(spec.props?.[dir] ?? {})) {
        fs.writeFileSync(path.join(ed, 'remotion-props', f), JSON.stringify(json, null, 2));
      }
    }
  }
  for (const [name, base] of Object.entries(spec.catalogue ?? {})) {
    const d = path.join(root, 'props', name);
    fs.mkdirSync(d, { recursive: true });
    if (base !== null) fs.writeFileSync(path.join(d, 'base.json'), JSON.stringify(base, null, 2));
  }
}

const CASES = [
  {
    name: 'a clean tree passes',
    spec: { seasons: { S01: { 'E001-a-slug': EP('S01E001') } } },
    want: null,
  },
  {
    name: 'lineage.parent naming a missing episode fails',
    spec: { seasons: { S01: { 'E001-a-slug': EP('S01E001', { lineage: { parent: 'S09E999' } }) } } },
    want: /lineage\.parent names S09E999, which does not exist/,
  },
  {
    name: 'a lineage cycle fails',
    spec: {
      seasons: {
        S01: {
          'E001-a-slug': EP('S01E001', { lineage: { parent: 'S01E002' } }),
          'E002-a-slug': EP('S01E002', { lineage: { parent: 'S01E001' } }),
        },
      },
    },
    want: /lineage\.parent chain cycles/,
  },
  {
    name: 'a props $ref with no catalogue entry fails',
    spec: {
      seasons: { S01: { 'E001-a-slug': EP('S01E001') } },
      props: { 'E001-a-slug': { 'profile-card.json': { $ref: 'profile-card', label: 'x' } } },
    },
    want: /\$ref "profile-card" has no props\/ entry/,
  },
  {
    name: 'relation without parent fails',
    spec: { seasons: { S01: { 'E001-a-slug': EP('S01E001', { lineage: { relation: 'remedy' } }) } } },
    want: /relation set with no lineage\.parent/,
  },
  {
    name: 'the retired DBX- id is named as retired, not merely invalid',
    spec: { seasons: { S01: { 'E001-a-slug': EP('DBX-APP-S01E001') } } },
    want: /retired DBX- form/,
  },
  {
    name: 'two episodes claiming one id fails',
    spec: {
      seasons: {
        S01: { 'E001-a-slug': EP('S01E001'), 'E002-a-slug': EP('S01E001') },
      },
    },
    want: /is also claimed by/,
  },
  {
    name: 'an episode in the wrong season fails',
    spec: { seasons: { S02: { 'E001-a-slug': EP('S01E001') } } },
    want: /is not in season S02/,
  },
  {
    name: 'a season with no README fails',
    spec: { seasons: { S01: { 'E001-a-slug': EP('S01E001') } }, noReadme: true },
    want: /no README\.md/,
  },
];

export function selftest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vm-selftest-'));
  let pass = 0;
  const fails = [];
  CASES.forEach((c, i) => {
    const root = path.join(tmp, `case${i}`);
    build(root, c.spec);
    if (c.spec.noReadme) {
      for (const s of Object.keys(c.spec.seasons)) fs.rmSync(path.join(root, 'series', s, 'README.md'));
    }
    const { report } = checkTree(root);
    const all = report.errors.join('\n');
    const ok = c.want ? c.want.test(all) : report.errors.length === 0;
    if (ok) pass++;
    else fails.push(`  ${c.name}\n    wanted: ${c.want ?? '(no errors)'}\n    got:    ${all || '(none)'}`);
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${c.name}`);
  });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (fails.length) console.log(`\n${fails.join('\n')}`);
  console.log(`\n${pass}/${CASES.length} selftest case(s) passed`);
  return fails.length === 0;
}
