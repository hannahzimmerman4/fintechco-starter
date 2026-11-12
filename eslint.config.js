import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['src/**'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.config.js', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
);
