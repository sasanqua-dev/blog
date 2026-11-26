import { type CollectionEntry, getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import { type OgpCategory, renderOgpImage } from '../../../lib/ogp';

// One PNG per post, written to dist/og/<collection>/<id>.png at build time.
export const getStaticPaths = (async () => {
	const tech = await getCollection('tech');
	const blog = await getCollection('blog');

	const entries: Array<{ category: OgpCategory; post: CollectionEntry<OgpCategory> }> = [
		...tech.map((post) => ({ category: 'tech' as const, post })),
		...blog.map((post) => ({ category: 'blog' as const, post })),
	];

	return entries.map(({ category, post }) => ({
		params: { collection: category, slug: post.id },
		props: { category, post },
	}));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
	const { category, post } = props as {
		category: OgpCategory;
		post: CollectionEntry<OgpCategory>;
	};

	const png = await renderOgpImage({
		title: post.data.title,
		description: post.data.description,
		category,
		date: post.data.pubDate,
	});

	return new Response(png, {
		headers: { 'Content-Type': 'image/png' },
	});
};
