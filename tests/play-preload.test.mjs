import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

// play/index.html preloads play.js's whole module graph (three.js included,
// through the import map) so the browser fetches it in one round trip. A preload whose ?v= drifts from the import
// downloads the file twice, so keep the two lists identical.

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('play/index.html', root), 'utf8');
const importMap = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;

function resolve(dep, from) {
  if (importMap[dep]) return importMap[dep];
  const prefix = Object.keys(importMap).find((key) => key.endsWith('/') && dep.startsWith(key));
  if (prefix) return importMap[prefix] + dep.slice(prefix.length);
  const url = new URL(dep, `https://x${from}`);
  return url.pathname + url.search;
}

function localImports(specifier, seen = new Set()) {
  if (seen.has(specifier)) return seen;
  seen.add(specifier);
  const path = specifier.split('?')[0].slice(1);
  const source = readFileSync(new URL(path, root), 'utf8');
  for (const [, dep] of source.matchAll(/^import\s[^;]*?["']([^"']+)["'];?$/gm)) {
    localImports(resolve(dep, specifier), seen);
  }
  return seen;
}

test('modulepreload list matches the play.js import graph', () => {
  const entry = html.match(/<script type="module" src="([^"]+)"/)[1];
  const graph = localImports(entry);
  graph.delete(entry);
  const preloaded = new Set([...html.matchAll(/<link rel="modulepreload" href="(\/[^"]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...preloaded].sort(), [...graph].sort());
});
