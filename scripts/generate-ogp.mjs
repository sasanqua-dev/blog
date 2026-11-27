#!/usr/bin/env node
/**
 * Pre-build script: generate all OGP images as static PNGs into public/og/.
 * Runs in plain Node.js before astro build, so native modules (resvg-js) and
 * satori's WASM loader work without Cloudflare adapter compatibility issues.
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read front-matter from a markdown file (simple regex-based, no parser needed).
function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^['"]|['"]$/g, '');
    fm[key] = val;
  }
  return fm;
}

async function collectPosts(collection) {
  const dir = join(root, 'src/content', collection);
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  return files
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => {
      const id = basename(f, f.endsWith('.mdx') ? '.mdx' : '.md');
      const fm = parseFrontMatter(readFileSync(join(dir, f), 'utf8'));
      return { id, collection, title: fm.title ?? id, description: fm.description, pubDate: fm.pubDate };
    });
}

async function main() {
  // Dynamic import so the module initializes in Node.js, not in Worker context.
  const { renderOgpImage } = await import('../src/lib/ogp.ts');

  const collections = ['tech', 'blog'];
  const posts = (await Promise.all(collections.map(collectPosts))).flat();

  for (const post of posts) {
    const outDir = join(root, 'public/og', post.collection);
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, `${post.id}.png`);

    if (existsSync(outPath)) {
      process.stdout.write(`skip  /og/${post.collection}/${post.id}.png\n`);
      continue;
    }

    process.stdout.write(`gen   /og/${post.collection}/${post.id}.png ... `);
    const png = await renderOgpImage({
      title: post.title,
      description: post.description,
      category: post.collection,
      date: new Date(post.pubDate ?? '2020-01-01'),
    });
    writeFileSync(outPath, png);
    process.stdout.write('done\n');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
