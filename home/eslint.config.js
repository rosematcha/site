import { createRequire } from 'node:module';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import imports from 'eslint-plugin-import';
const require = createRequire(import.meta.url);
const legacy = require('./.eslintrc.cjs');
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { files: ["scripts/**/*.mjs", "*.config.js"], languageOptions: { globals: globals.node }, rules: { ...js.configs.recommended.rules, complexity: ["error", 12] } },
  { ignores: ['public/**', 'coverage/**', 'dist/**', 'eslint-rules/**'] },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'e2e/**/*.ts', 'playwright.config.ts'],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest }, parserOptions: { ecmaFeatures: { jsx: true } } },
    settings: { react: { version: 'detect' }, 'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } }, 'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] } },
    plugins: { react, import: imports, 'react-hooks': reactHooks, 'react-refresh': reactRefresh, 'jsx-a11y': jsxA11y },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...imports.configs.recommended.rules,
      ...legacy.rules,
      "import/extensions": ["error", "ignorePackages", { js: "never", jsx: "never", ts: "never", tsx: "never" }],
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      complexity: ['error', 12],
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    },
  },
  ...tseslint.configs.strictTypeChecked.map(config => ({ ...config, files: ['src/**/*.{ts,tsx}', 'e2e/**/*.ts', 'playwright.config.ts'] })),
  {
    files: ['src/**/*.{ts,tsx}', 'e2e/**/*.ts', 'playwright.config.ts'],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  { files: ['src/**/*.test.{js,jsx,ts,tsx}', 'e2e/**/*.ts'], rules: { 'react-refresh/only-export-components': 'off' } },
);
