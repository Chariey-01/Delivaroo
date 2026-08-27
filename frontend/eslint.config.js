import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // Test files run under Jest, not in a browser: `describe`, `test`, `expect` and
  // `jest` are globals there, and Node's globals are available too.
  {
    files: ['**/*.test.{js,jsx}', 'src/__tests__/**/*.{js,jsx}', 'src/__mocks__/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.jest, ...globals.node },
    },
  },
  // CommonJS: the Jest/Babel configs and the .cjs mocks.
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'commonjs',
    },
  },
  // ESM config files that still run in Node (vite.config.js reads process.env).
  {
    files: ['*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
])
