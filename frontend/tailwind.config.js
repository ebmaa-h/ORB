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
      'black': '#000000',
      'red': '#FF0000',
      'white': '#fff',
      'blue': '#1fb6ff',
      'purple': '#7e5bef',
      'pink': '#ff49db',
      'orange': '#ff7849',
      'green': '#13ce66',
      'yellow': '#ffc82c',

      "gray-900": "#b3b3b3",
      "gray-800": "#bfbfbf",
      "gray-700": "#cccccc",
      "gray-600": "#d4d4d4",
      "gray-500": "#dbdbdb",
      "gray-400": "#e3e3e3",
      "gray-300": "#ebebeb",
      "gray-200": "#f2f2f2",
      "gray-100": "#f7f7f7",

      "gray-blue-100": "#e9edf0",
      "gray-blue-200": "#cfd8df",
      "gray-blue-300": "#b4c2ce",
      "gray-blue-400": "#99acbd",
      "gray-blue-500": "#7e97ad",
      "gray-blue-600": "#637f95",
      "gray-blue-700": "#4a667a",
      "gray-blue-800": "#324c5f",
      
      "green-500": "#4BB543",
      "red-500": "#FC100D",
      "gray-dark": "#273444",
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

