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
				// Remap Tailwind's amber and slate so the admin CRM (and any legacy
				// public components) pick up the brass / teal-ivory palette without
				// editing hundreds of class names.
				amber: {
					50: '#FAF6EE', 100: '#F3EAD6', 200: '#E7D5AE', 300: '#D9BE87', 400: '#C2A36A',
					500: '#9C7C3C', 600: '#86692F', 700: '#6E5625', 800: '#56431D', 900: '#3F3215', 950: '#2A210E',
				},
				slate: {
					50: '#F4EFE6', 100: '#ECE5D8', 200: '#DCD2C1', 300: '#C3BBAA', 400: '#948D7E',
					500: '#6B6456', 600: '#4A5454', 700: '#33403F', 800: '#1A3435', 900: '#0C2B2C', 950: '#071C1D',
				},
			},
		},
	},
};
