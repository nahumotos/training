import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dist-demo', 'dist-prueba', 'dev-dist', 'ia-worker', 'node_modules', 'pruebas/e2e/resultados'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['pruebas/**/*.mjs', 'scripts/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 2023, globals: { ...globals.node, ...globals.browser } },
  },
);
