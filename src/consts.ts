// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Archi Diagram';
export const SITE_DESCRIPTION = 'Free Tutorials, Templates & SketchUp Extensions for Architectural Diagrams by Febhouse.';

export const DEDICATED_LANDING_PAGE_SLUGS = [
	'sun-diagram',
	'dynamic-symbols',
	'shadow-slice',
];

export const REDIRECTED_LEGACY_SLUGS = [
	'custom-diagram-service',
	'sun-path-diagram',
	'dynamic-symbols-for-architectural-diagram',
	'3d-symbol',
	'3d-symbols-for-architectural-diagram',
];

export function isPublishablePost(post: { id: string; data: { tags?: string } }) {
	if (!post.data.tags || post.data.tags.trim() === '') return false;
	const cleanSlug = post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
	return !REDIRECTED_LEGACY_SLUGS.includes(cleanSlug);
}

export function isDynamicSlugRoute(post: { id: string; data: { tags?: string } }) {
	if (!isPublishablePost(post)) return false;
	const cleanSlug = post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
	return !DEDICATED_LANDING_PAGE_SLUGS.includes(cleanSlug);
}
