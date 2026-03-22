import type { Config } from '@react-router/dev/config';

export default {
	appDirectory: './src/app',
	ssr: true,
	prerender: false,
	routeDiscovery: { mode: 'initial' },
} satisfies Config;
