import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
      'bg-sunny',
      'bg-cloudy',
      'bg-rainy',
      'bg-snowy'
  ],
  theme: {
    extend: {
      backgroundImage: {
        'sunny': "url('/background/sunny.png')",
        'cloudy': "url('/background/cloudy.png')",
        'rainy': "url('/background/rainy.png')",
        'snowy': "url('/background/snowy.png')",
      },
      colors: {
        snow: "#F3F3F3",
        light: "#BCBCBC",
        middle: "#686868",
        base: "#1E1E1E",
        point: "#FFCC00",
        warning: "#FF383C",
        warningAccent: "#d50104",
        primary: "#51ABFF",
        accent: "#2C86DB",
      }
    },
  },
  plugins: [],
} as Config;

export default config;