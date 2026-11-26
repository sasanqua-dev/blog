import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

/**
 * Per-article Open Graph image renderer.
 *
 * The layout is drawn with satori (an object tree -> SVG) and rasterised with
 * resvg (SVG -> PNG). Everything runs at build time, so the PNGs are static
 * files in dist/ and nothing is rendered per request in production.
 *
 * satori does not honour -webkit-line-clamp, so text is wrapped and truncated
 * here with a width estimate, and every line is emitted as its own element.
 */

export const OGP_WIDTH = 1200;
export const OGP_HEIGHT = 630;

const SITE_LABEL = 'blog.saqu.dev';
const FONT_FAMILY = 'Noto Sans JP';
const FONT_PATH = path.join(process.cwd(), 'src/assets/fonts/NotoSansJP-Bold.woff');

const PADDING_X = 96;
const PADDING_Y = 84;
const CONTENT_WIDTH = OGP_WIDTH - PADDING_X * 2;
// Wrap a little narrower than the box so satori's own shaping never wraps a line we already cut.
const WRAP_WIDTH = Math.floor(CONTENT_WIDTH * 0.96);
const CONTENT_HEIGHT = OGP_HEIGHT - PADDING_Y * 2;
const TITLE_LINE_HEIGHT = 1.28;
const DESC_FONT_SIZE = 28;
const DESC_LINE_HEIGHT = 1.55;
const DESC_MAX_LINES = 2;
const TITLE_MAX_LINES = 3;
const TITLE_SIZES = [84, 76, 68, 60, 54, 48];

// Sky palette: daytime blue fading to a pale horizon, with navy type for contrast.
const palette = {
	skyTop: '#5aa3d9',
	skyMid: '#a3d4f1',
	skyLow: '#eaf7fd',
	ink: '#0c2a44',
	inkSoft: 'rgba(12, 42, 68, 0.8)',
	inkFaint: 'rgba(12, 42, 68, 0.62)',
	line: 'rgba(12, 42, 68, 0.2)',
	chipBg: '#0c2a44',
	chipText: '#eaf7fd',
	accent: '#2f6f9f',
};

export type OgpCategory = 'tech' | 'blog';

export interface OgpInput {
	title: string;
	description?: string;
	category: OgpCategory;
	date: Date;
}

/** Root-relative URL of the generated image for a post. */
export function ogpImagePath(category: OgpCategory, id: string): string {
	return `/og/${category}/${id}.png`;
}

// ---------------------------------------------------------------------------
// Text measurement and wrapping
// ---------------------------------------------------------------------------

// CJK ideographs, kana, Hangul and full-width forms take a full em.
const WIDE_CHAR = /[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-￯　-〿]/u;
const ELLIPSIS = '…';
// Characters that should not start a line (Japanese line-breaking rules, kinsoku).
const NO_LINE_START = /^[、。，．・ー」』）】〕!?！？…っゃゅょぁぃぅぇぉゎゕゖ々〆ゝゞヽヾ]$/u;

/** Rough advance width of a string at a given font size, in px. */
function measure(text: string, fontSize: number): number {
	let em = 0;
	for (const ch of text) em += WIDE_CHAR.test(ch) ? 1 : 0.5;
	return em * fontSize;
}

/**
 * Greedy word-aware wrap. Latin runs are kept together where possible;
 * everything else breaks between characters.
 */
function wrap(text: string, fontSize: number, maxWidth: number): string[] {
	const tokens = text.replace(/\s+/g, ' ').trim().match(/[!-~]+| |./gu) ?? [];
	const lines: string[] = [];
	let line = '';

	for (const token of tokens) {
		const candidate = line + token;
		const fits = measure(candidate.trimEnd(), fontSize) <= maxWidth;
		// A forbidden line-start character may hang one glyph past the edge rather than start a line.
		const hang = NO_LINE_START.test(token) && measure(candidate.trimEnd(), fontSize) <= maxWidth + fontSize;
		if (fits || hang || line === '') {
			line = candidate;
			continue;
		}
		lines.push(line.trimEnd());
		line = token === ' ' ? '' : token;
	}
	if (line.trim()) lines.push(line.trimEnd());
	return lines;
}

/** Wraps, then cuts to `maxLines` with an ellipsis on the final line if needed. */
function fitLines(text: string, fontSize: number, maxWidth: number, maxLines: number): string[] {
	const lines = wrap(text, fontSize, maxWidth);
	if (lines.length <= maxLines) return lines;

	const kept = lines.slice(0, maxLines);
	let last = kept[maxLines - 1];
	while (last.length > 0 && measure(last + ELLIPSIS, fontSize) > maxWidth) {
		last = [...last].slice(0, -1).join('');
	}
	kept[maxLines - 1] = last.trimEnd() + ELLIPSIS;
	return kept;
}

/**
 * Picks the largest title size whose wrapped title fits within the vertical
 * budget. Falls back to the smallest size, truncated to whatever fits.
 */
function layoutTitle(title: string, heightBudget: number): { fontSize: number; lines: string[] } {
	for (const fontSize of TITLE_SIZES) {
		const lines = wrap(title, fontSize, WRAP_WIDTH);
		const fits = lines.length <= TITLE_MAX_LINES && lines.length * fontSize * TITLE_LINE_HEIGHT <= heightBudget;
		if (fits) return { fontSize, lines };
	}

	const fontSize = TITLE_SIZES[TITLE_SIZES.length - 1];
	const maxLines = Math.max(1, Math.min(TITLE_MAX_LINES, Math.floor(heightBudget / (fontSize * TITLE_LINE_HEIGHT))));
	return { fontSize, lines: fitLines(title, fontSize, WRAP_WIDTH, maxLines) };
}

// ---------------------------------------------------------------------------
// Tree construction
// ---------------------------------------------------------------------------

// satori takes a React-like tree. Plain objects avoid needing a JSX transform.
interface Node {
	type: string;
	props: Record<string, unknown> & { children?: Node | Node[] | string };
}

type Child = Node | string | false | null | undefined;

function h(type: string, props: Record<string, unknown>, ...children: Child[]): Node {
	const flat = children.filter((c): c is Node | string => c !== false && c !== null && c !== undefined);
	const value = flat.length === 0 ? undefined : flat.length === 1 ? flat[0] : flat;
	return { type, props: { ...props, children: value } };
}

function formatDate(date: Date): string {
	return date.toISOString().slice(0, 10).replaceAll('-', '.');
}

function buildTree({ title, description, category, date }: OgpInput): Node {
	const categoryLabel = category === 'tech' ? 'TECH' : 'BLOG';
	const descLines = description ? fitLines(description, DESC_FONT_SIZE, WRAP_WIDTH, DESC_MAX_LINES) : [];

	// Vertical budget: the title gets whatever the fixed rows and the description leave.
	const fixedHeight = 44 /* chip row */ + 48 /* gap above title */ + 52 /* footer */;
	const descHeight = descLines.length > 0 ? descLines.length * DESC_FONT_SIZE * DESC_LINE_HEIGHT + 28 : 0;
	const titleLayout = layoutTitle(title, CONTENT_HEIGHT - fixedHeight - descHeight);

	// Thin frame inset from the edge.
	const frame = h('div', {
		style: {
			position: 'absolute',
			top: 28,
			left: 28,
			right: 28,
			bottom: 28,
			border: `1px solid ${palette.line}`,
			borderRadius: 18,
		},
	});

	const chip = h(
		'div',
		{
			style: {
				display: 'flex',
				alignItems: 'center',
				height: 44,
				padding: '0 20px',
				borderRadius: 999,
				background: palette.chipBg,
				color: palette.chipText,
				fontSize: 22,
				fontWeight: 700,
				letterSpacing: '0.16em',
			},
		},
		categoryLabel,
	);

	const siteLabel = h(
		'div',
		{
			style: {
				display: 'flex',
				fontSize: 24,
				fontWeight: 700,
				letterSpacing: '0.04em',
				color: palette.inkFaint,
			},
		},
		SITE_LABEL,
	);

	const header = h(
		'div',
		{ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
		chip,
		siteLabel,
	);

	const titleBlock = h(
		'div',
		{ style: { display: 'flex', flexDirection: 'column' } },
		...titleLayout.lines.map((line) =>
			h(
				'div',
				{
					style: {
						display: 'flex',
						fontSize: titleLayout.fontSize,
						lineHeight: TITLE_LINE_HEIGHT,
						fontWeight: 700,
						letterSpacing: '-0.01em',
						color: palette.ink,
					},
				},
				line,
			),
		),
	);

	const descBlock =
		descLines.length > 0
			? h(
					'div',
					{ style: { display: 'flex', flexDirection: 'column', marginBottom: 28 } },
					...descLines.map((line) =>
						h(
							'div',
							{
								style: {
									display: 'flex',
									fontSize: DESC_FONT_SIZE,
									lineHeight: DESC_LINE_HEIGHT,
									color: palette.inkSoft,
								},
							},
							line,
						),
					),
				)
			: false;

	const footer = h(
		'div',
		{
			style: {
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				paddingTop: 22,
				borderTop: `1px solid ${palette.line}`,
			},
		},
		h(
			'div',
			{
				style: { display: 'flex', fontSize: 24, fontWeight: 700, letterSpacing: '0.08em', color: palette.inkSoft },
			},
			formatDate(date),
		),
		h(
			'div',
			{
				style: { display: 'flex', fontSize: 22, fontWeight: 700, letterSpacing: '0.16em', color: palette.accent },
			},
			'READ',
		),
	);

	const content = h(
		'div',
		{
			style: {
				position: 'absolute',
				top: PADDING_Y,
				left: PADDING_X,
				right: PADDING_X,
				bottom: PADDING_Y,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
			},
		},
		header,
		titleBlock,
		h('div', { style: { display: 'flex', flexDirection: 'column' } }, descBlock, footer),
	);

	return h(
		'div',
		{
			style: {
				position: 'relative',
				display: 'flex',
				width: OGP_WIDTH,
				height: OGP_HEIGHT,
				overflow: 'hidden',
				backgroundImage: `linear-gradient(180deg, ${palette.skyTop} 0%, ${palette.skyMid} 55%, ${palette.skyLow} 100%)`,
				fontFamily: FONT_FAMILY,
			},
		},
		frame,
		content,
	);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

let fontPromise: Promise<Buffer> | undefined;
function loadFont(): Promise<Buffer> {
	fontPromise ??= readFile(FONT_PATH);
	return fontPromise;
}

/** Renders one post's OGP image and returns it as PNG bytes. */
export async function renderOgpImage(input: OgpInput): Promise<Uint8Array> {
	const fontData = await loadFont();
	const svg = await satori(buildTree(input) as never, {
		width: OGP_WIDTH,
		height: OGP_HEIGHT,
		fonts: [{ name: FONT_FAMILY, data: fontData, weight: 700, style: 'normal' }],
	});

	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: OGP_WIDTH },
		font: {
			fontBuffers: [fontData],
			loadSystemFonts: false,
			defaultFontFamily: FONT_FAMILY,
		},
	});
	return resvg.render().asPng();
}
