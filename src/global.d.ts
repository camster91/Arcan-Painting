import 'react-router';

declare global {
	interface Window {
		__arcanCsrfPatched?: boolean;
	}
}

module 'virtual:load-fonts.jsx' {
	export function LoadFonts(): null;
}
declare module 'react-router' {
	interface AppLoadContext {
		// add context properties here
	}
}
