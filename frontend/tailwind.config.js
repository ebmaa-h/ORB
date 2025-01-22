/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '976px',
      xl: '1440px',
    },
    colors: {
      'red': '#FF0000',
      'white': '#fff',
      'blue': '#1fb6ff',
      'purple': '#7e5bef',
      'pink': '#ff49db',
      'orange': '#ff7849',
      'green': '#13ce66',
      'yellow': '#ffc82c',
      'gray-dark': '#273444',
      'gray': '#8492a6',
      'gray-light': '#d3dce6',
      'ebmaa-blue': '#59C4CE',
      'ebmaa-green': '#BDD331',
      'ebmaa-purple': '#7580BE',
      'ebmaa-purple-light': '#96a0d9',
    },
    fontFamily: {
      sans: ['arial', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    extend: {
      fontSize: {
        'uxss': '0.525rem',
        'xss': '0.625rem',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  },
  plugins: [
    // function ({ addUtilities }) {
    //   addUtilities({
    //     '.link-class': {
    //       '@apply': 'text-sm text-center min-w-[100px] rounded hover:border hover:border-ebmaa-purple',
    //     },
    //   });
    // },
  ],
}

