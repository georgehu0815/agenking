/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/webview/**/*.{js,jsx,ts,tsx,html}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable Tailwind's base styles to avoid conflicts with VS Code
  },
};
