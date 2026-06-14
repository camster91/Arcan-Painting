import type { Config } from '@react-router/dev/config';

// routeDiscovery: removed — the default in React Router 7 is 'lazy', which
// was changed to 'initial' in 2026-06-12 to 'fix SSR hydration crash' but
// that change broke every non-index route (the SSR rendered the home
// page SEO block + the home page JSX for /quote, /blog, /contact,
// /admin, /admin/leads, /thank-you — every URL was getting the
// home page's content, with the route module loaded but not rendered).
// Default 'lazy' lets the runtime resolve route data on demand and
// correctly renders the matched page.
export default {
	appDirectory: './src/app',
	ssr: true,
	prerender: false,
} satisfies Config;
