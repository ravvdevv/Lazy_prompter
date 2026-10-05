import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

const unusedCapitalised = [
  'error',
  // Capitalised identifiers are JSX components. They are consumed by JSX
  // rather than by an expression, which the core rule cannot see, so they must
  // be exempted in both var and argument position.
  { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' },
]

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: { 'no-unused-vars': unusedCapitalised },
  },
  {
    // Serverless functions run on Node, so they get Node globals and no JSX.
    files: ['api/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      sourceType: 'module',
    },
    rules: { 'no-unused-vars': unusedCapitalised },
  },
  {
    files: ['*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      sourceType: 'module',
    },
    rules: { 'no-unused-vars': unusedCapitalised },
  },
])