// The props catalogue: where a composition's props live, who uses them, and how one moves.
//
// WHY A CATALOGUE. Measured before the move: 48 props files, 34 distinct names, 8 names used by
// more than one episode (profile-card in four, captions.all in four, brand-title in two), and no
// way to ask "where is this used" short of a filesystem sweep. Changing a shared card's shape was
// N edits and a hope.
//
// WHY PROMOTE AND DEMOTE, RATHER THAN A MIGRATION. Whether a prop SHOULD be shared is an editorial
// judgement — two episodes using `profile-card` may want it to drift apart. Making the move
// reversible is what makes the judgement cheap: promote is not a commitment, because demote exists.
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, loadTree } from '../lib.mjs';

// Both directions write keys in a canonical order. Without it a promote/demote round trip returns
// the same OBJECT with its keys shuffled, which is semantically identical and still shows up as a
// four-file diff — noise that makes the reversibility hard to believe when you look at it in git.
// `$ref` leads because it is what the file IS; the rest is sorted.
const ordered = (o) => {
  const keys = Object.keys(o).sort();
  const head = keys.includes('$ref') ? ['$ref'] : [];
  return Object.fromEntries([...head, ...keys.filter((k) => k !== '$ref')].map((k) => [k, o[k]]));
};
const write = (file, obj) => fs.writeFileSync(file, JSON.stringify(ordered(obj), null, 2) + '\n');

export const propsRoot = (root = REPO_ROOT) => path.join(root, 'props');

// A reference is `{"$ref": "<name>", ...overrides}`. Overrides are shallow-merged over the base,
// which is deliberate: a deep merge makes it impossible to see, from the episode file alone, what
// the rendered object will be.
export function isRef(obj) {
  return obj && typeof obj === 'object' && typeof obj.$ref === 'string';
}

export function catalogueEntries(root = REPO_ROOT) {
  const base = propsRoot(root);
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => {
      const dir = path.join(base, d.name);
      const basePath = path.join(dir, 'base.json');
      let json = null;
      if (fs.existsSync(basePath)) {
        try { json = JSON.parse(fs.readFileSync(basePath, 'utf8')); } catch { json = null; }
      }
      return { name: d.name, dir, basePath, base: json };
    });
}

function epPropsDir(ep) {
  return path.join(ep.dir, 'remotion-props');
}

export function episodePropFiles(ep) {
  const d = epPropsDir(ep);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((f) => f.endsWith('.json')).sort();
}

// `profile-card.json` and `profile-card.zh-CN.json` are the same composition. The locale suffix is
// a variant of one prop set, not a second prop set, so `where` and `promote` join on the stem.
export function stemOf(file) {
  return file.replace(/\.json$/, '').replace(/\.[a-z]{2}-[A-Z]{2}$/, '');
}

export function propRefs(tree) {
  const out = [];
  for (const ep of tree.episodes) {
    for (const file of episodePropFiles(ep)) {
      let json;
      try { json = JSON.parse(fs.readFileSync(path.join(epPropsDir(ep), file), 'utf8')); } catch { continue; }
      if (isRef(json)) out.push({ ep, file, ref: json.$ref, overrides: rest(json) });
    }
  }
  return out;
}

const rest = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== '$ref'));

export function usages(tree, name) {
  const out = [];
  for (const ep of tree.episodes) {
    for (const file of episodePropFiles(ep)) {
      if (stemOf(file) !== name) continue;
      const full = path.join(epPropsDir(ep), file);
      let json = null;
      try { json = JSON.parse(fs.readFileSync(full, 'utf8')); } catch { /* reported by check */ }
      out.push({ ep, file, path: full, ref: isRef(json) ? json.$ref : null, json });
    }
  }
  return out;
}

// Resolve one already-parsed props object. Shallow-merge over the catalogue base, so what the
// renderer sees is exactly base + the overrides visible in the episode file.
export function resolveProps(json, root = REPO_ROOT) {
  if (!isRef(json)) return json;
  const entry = catalogueEntries(root).find((e) => e.name === json.$ref);
  if (!entry || !entry.base) throw new Error(`props $ref "${json.$ref}" has no props/ entry`);
  return { ...entry.base, ...rest(json) };
}

export function resolve(tree, ep, file) {
  const full = path.join(epPropsDir(ep), file);
  const json = JSON.parse(fs.readFileSync(full, 'utf8'));
  if (!isRef(json)) return json;
  const entry = catalogueEntries(tree.root).find((e) => e.name === json.$ref);
  if (!entry || !entry.base) throw new Error(`${file}: $ref "${json.$ref}" has no props/ entry`);
  return { ...entry.base, ...rest(json) };
}

// Promote: the shared keys become base.json, the per-episode differences become overrides. Refuses
// nothing — a key that differs everywhere simply stays an override in every file. What it will not
// do is silently pick one episode's value as the base for a key the episodes disagree on, which is
// the way a catalogue quietly changes four videos at once.
export function promote(tree, name, { apply = false } = {}) {
  const uses = usages(tree, name).filter((u) => !u.ref);
  if (uses.length === 0) return { name, error: `no episode-local props named "${name}"` };
  const objs = uses.map((u) => u.json).filter((o) => o && typeof o === 'object' && !Array.isArray(o));
  if (objs.length !== uses.length) return { name, error: 'one or more props files are not JSON objects' };

  const keys = [...new Set(objs.flatMap((o) => Object.keys(o)))].sort();
  const shared = {};
  const differing = [];
  for (const k of keys) {
    const vals = objs.map((o) => JSON.stringify(o[k]));
    if (vals.every((v) => v === vals[0]) && objs.every((o) => k in o)) shared[k] = objs[0][k];
    else differing.push(k);
  }
  const plan = {
    name,
    uses: uses.length,
    sharedKeys: Object.keys(shared),
    overrideKeys: differing,
    base: shared,
    files: uses.map((u) => ({
      path: path.relative(tree.root, u.path),
      ref: { $ref: name, ...Object.fromEntries(differing.filter((k) => k in u.json).map((k) => [k, u.json[k]])) },
    })),
  };
  if (!apply) return plan;

  const dir = path.join(propsRoot(tree.root), name);
  fs.mkdirSync(dir, { recursive: true });
  write(path.join(dir, 'base.json'), shared);
  for (const u of uses) {
    write(u.path, { $ref: name, ...Object.fromEntries(differing.filter((k) => k in u.json).map((k) => [k, u.json[k]])) });
  }
  return { ...plan, applied: true };
}

// Demote: write each reference back out as the object it resolves to, then drop the entry. The
// result is the same object a renderer was already being handed — same keys, same values, in
// canonical key order. That is what makes promote safe to try: the operation is reversible, so the
// decision is not load-bearing, and whether two episodes SHOULD share a prop set stays an editorial
// call rather than an architectural one.
export function demote(tree, name, { apply = false } = {}) {
  const uses = usages(tree, name).filter((u) => u.ref === name);
  const entry = catalogueEntries(tree.root).find((e) => e.name === name);
  if (!entry) return { name, error: `no catalogue entry "${name}"` };
  const plan = {
    name,
    uses: uses.length,
    files: uses.map((u) => ({ path: path.relative(tree.root, u.path), resolved: { ...entry.base, ...rest(u.json) } })),
  };
  if (!apply) return plan;
  for (const f of plan.files) write(path.join(tree.root, f.path), f.resolved);
  fs.rmSync(entry.dir, { recursive: true, force: true });
  return { ...plan, applied: true };
}

export function index(root = REPO_ROOT) {
  const tree = loadTree(root);
  const byName = new Map();
  for (const ep of tree.episodes) {
    for (const file of episodePropFiles(ep)) {
      const stem = stemOf(file);
      if (!byName.has(stem)) byName.set(stem, []);
      byName.get(stem).push(`${ep.season.id}/${ep.dirName}/${file}`);
    }
  }
  const cat = new Set(catalogueEntries(root).map((e) => e.name));
  return [...byName.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([name, files]) => ({ name, catalogued: cat.has(name), count: files.length, files }));
}
