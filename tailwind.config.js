/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        coffee: {
          dark: '#111111',
          cream: '#FFE7A3',
          amber: '#FF7A00',
          brown: '#2B2B2B',
          soft: '#FFF3D8',
        },
        neo: {
          ink: '#111111',
          paper: '#FFF3D8',
          yellow: '#FFE14D',
          orange: '#FF7A00',
          pink: '#FF5DA2',
          blue: '#55C7FF',
          green: '#74F28A',
          purple: '#B487FF',
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', '"Arial Black"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        warm: '8px 8px 0 #111111',
        neo: '6px 6px 0 #111111',
        'neo-sm': '4px 4px 0 #111111',
        'neo-lg': '12px 12px 0 #111111',
        'neo-xl': '18px 18px 0 #111111',
      },
      backgroundImage: {
        'coffee-gradient': 'linear-gradient(135deg, #111111 0%, #FF7A00 55%, #FFE14D 100%)',
      },
    },
  },
  plugins: [],
}
