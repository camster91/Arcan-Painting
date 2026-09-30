module.exports = {
	content: ['./src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		fontFamily: {
			sans: ['Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			display: ['Fraunces Variable', 'Fraunces', 'Georgia', 'Cambria', 'serif'],
		},
		extend: {
			fontFamily: {
				'dancing-script': ['Dancing Script', 'cursive'],
			},
			// Luxury palette for the public site. Deep teal-green carries the dark
			// sections, warm ivory the light ones, brushed brass is the accent.
			colors: {
				paper: { DEFAULT: '#F4EFE6', deep: '#E8E0D0' },
				ink: { DEFAULT: '#0C2B2C', soft: '#3A4E4E' },
				brand: { DEFAULT: '#C2A36A', deep: '#7D6128' },
				line: '#D6CBB6',
				muted: '#655F52',
			},
		},
	},
};
