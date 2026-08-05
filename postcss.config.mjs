/** Tailwind CSS v4 uses a PostCSS plugin; tokens are defined CSS-first in
 *  src/styles/theme.css (M1), not in a JS config object. */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
