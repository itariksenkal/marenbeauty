import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default tseslint.config(
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'public/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextCoreWebVitals,

  {
    rules: {
      // CLAUDE.md §15 — no `any`, no silencing casts.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  {
    // Motion budget enforcement — docs/MOTION.md §7.
    // Timing values must come from src/config/motion.ts, never a literal.
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Property[key.name=/^(duration|delay|repeatDelay|transitionDuration|animationDuration|stiffness|damping)$/][value.type="Literal"]',
          message:
            'Motion timing must come from src/config/motion.ts (docs/MOTION.md §7). No numeric duration literals in components — the 400ms budget is enforced in one place.',
        },
      ],
    },
  },

  {
    // Node scripts are plain ESM, not part of the app graph.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly' },
    },
  },
);
