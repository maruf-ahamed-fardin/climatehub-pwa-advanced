/** @type {import('tailwindcss').Config} */

module.exports = {

  content: [

    "./app/**/*.{js,ts,jsx,tsx}",

    "./components/**/*.{js,ts,jsx,tsx}",

  ],

  darkMode: "class",

  theme: {

    extend: {

      colors: {

        navy: {

          900: '#0b1120',

          800: '#0f172a',

          700: '#1e293b',

        },

      },

      animation: {

        'fade-in': 'fadeIn 0.5s ease-out',

        'slide-up': 'slideUp 0.5s ease-out',

        'slide-down': 'slideDown 0.3s ease-out',

        'float': 'float 4s ease-in-out infinite',

      },

      keyframes: {

        fadeIn: {

          '0%': { opacity: '0' },

          '100%': { opacity: '1' },

        },

        slideUp: {

          '0%': { opacity: '0', transform: 'translateY(20px)' },

          '100%': { opacity: '1', transform: 'translateY(0)' },

        },

        slideDown: {

          '0%': { opacity: '0', transform: 'translateY(-10px)' },

          '100%': { opacity: '1', transform: 'translateY(0)' },

        },

        float: {

          '0%, 100%': { transform: 'translateY(0)' },

          '50%': { transform: 'translateY(-12px)' },

        },

      },

    },

  },

  plugins: [],

};

