module.exports = {
	content: ['./src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		fontFamily: {
			sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			display: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
		},
		extend: {
			fontFamily: {
				'dancing-script': ['Dancing Script', 'cursive'],
			},
			// Editorial palette for the public site. Navy and yellow are the
			// logo colours; paper/line/muted carry most of the page.
			colors: {
				paper: { DEFAULT: '#F6F2EA', deep: '#ECE5D8' },
				ink: { DEFAULT: '#16213A', soft: '#3A4358' },
				brand: { DEFAULT: '#F2B01E', deep: '#B27C00' },
				line: '#DCD2C1',
				muted: '#6B6456',
			},
		},
	},
};
