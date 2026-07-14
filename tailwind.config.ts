import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // FIFA Nexus AI token system — grounded in match-night floodlights & pitch markings
        pitchnight: '#0B132B', // primary background — the stadium at night
        pitchnight2: '#111C3A', // elevated surface
        chalk: '#F5F7FA', // primary text — pitch line white
        floodlight: '#FFB627', // primary accent — floodlight amber
        turf: '#1B8A5A', // secondary accent — pitch turf green (sustainability, success)
        clay: '#E14B4B', // alert / high-severity red
        mist: '#8592B0', // muted text / secondary
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};

export default config;
