#!/usr/bin/env node
import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-|\-$/g, '');
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  const category = (await ask('Category (tech / blog) [tech]: ')).trim() || 'tech';
  if (!['tech', 'blog'].includes(category)) {
    console.error('Invalid category.');
    process.exit(1);
  }

  const title = (await ask('Title: ')).trim();
  if (!title) { console.error('Title is required.'); process.exit(1); }

  const slugInput = (await ask(`Slug [${toSlug(title)}]: `)).trim();
  const slug = slugInput || toSlug(title);

  const description = (await ask('Description (optional): ')).trim();

  const branchInput = (await ask(`Create branch? (post/${today}-${slug}) [Y/n]: `)).trim().toLowerCase();
  const createBranch = branchInput !== 'n';

  rl.close();

  const filename = `${today}-${slug}.md`;
  const filepath = join(root, 'src', 'content', category, filename);

  if (existsSync(filepath)) {
    console.error(`File already exists: ${filepath}`);
    process.exit(1);
  }

  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
pubDate: "${today}"
---

`;

  writeFileSync(filepath, frontmatter);
  console.log(`\nCreated: src/content/${category}/${filename}`);

  if (createBranch) {
    const branch = `post/${today}-${slug}`;
    try {
      execSync(`git -C "${root}" checkout -b "${branch}"`, { stdio: 'inherit' });
    } catch {
      console.error('Branch creation failed. The file has been created.');
    }
  }
}

main();
