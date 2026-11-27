// @ts-check

import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://note.sasanqua.dev',
	output: 'static',
	adapter: cloudflare(),
	integrations: [mdx(), sitemap()],
	vite: {
		plugins: [
			{
				name: 'ignore-native-modules',
				load(id) {
					if (id.endsWith('.node')) return 'export default {}';
				},
			},
			{
				name: 'inline-binary-buffer',
				resolveId(id, importer) {
					if (!id.includes('?inline-buffer')) return;
					const rawPath = id.replace('?inline-buffer', '');
					const absPath = importer
						? resolve(dirname(importer.startsWith('file://') ? fileURLToPath(importer) : importer), rawPath)
						: resolve(rawPath);
					return '\0' + absPath + '?inline-buffer';
				},
				load(id) {
					if (!id.startsWith('\0') || !id.includes('?inline-buffer')) return;
					const realPath = id.slice(1).replace('?inline-buffer', '');
					const data = readFileSync(realPath).toString('base64');
					return `export default Buffer.from("${data}", "base64");`;
				},
			},
		],
		optimizeDeps: {
			exclude: ['@resvg/resvg-js', 'sharp'],
		},
		ssr: {
			external: ['@resvg/resvg-js', 'sharp'],
		},
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
