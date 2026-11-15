// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Cross-package imports must go through public exports (docs/development/project-structure.md). */
const noDeepPackageImports = {
  group: ['@crypto-force/*/src', '@crypto-force/*/src/**'],
  message:
    'Import from the package public export (e.g. "@crypto-force/shared"), not its internals.',
};

const noAppImports = {
  group: ['**/apps/**', '@crypto-force/web', '@crypto-force/api', '@crypto-force/worker'],
  message: 'Packages and apps must not import source from apps/*.',
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.react-router/**',
      'apps/api/drizzle/**',
      'docs/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.ts', 'apps/*/*.ts', 'packages/*/*.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-restricted-imports': ['error', { patterns: [noDeepPackageImports, noAppImports] }],
    },
  },

  {
    files: ['*.js', '**/*.config.{js,ts}'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Node.js runtimes
  {
    files: ['apps/api/**/*.ts', 'apps/worker/**/*.ts', '*.js', '**/*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },

  // Frontend
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  // Engine: pure, deterministic, no I/O and no environment access.
  {
    files: ['packages/engine/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'process', message: 'Engine must not read process/env; pass values as input.' },
        { name: 'fetch', message: 'Engine must not perform I/O.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noDeepPackageImports,
            noAppImports,
            {
              group: ['node:*', 'fs', 'path', 'http', 'https', 'net', 'child_process'],
              message: 'Engine must not perform I/O.',
            },
            {
              group: ['express', 'react', 'react-*', 'pg', 'pg-boss', 'drizzle-orm*', 'ws'],
              message: 'Engine must not depend on infrastructure or UI libraries.',
            },
          ],
        },
      ],
    },
  },

  // Shared contracts must not depend on the engine.
  {
    files: ['packages/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noDeepPackageImports,
            noAppImports,
            {
              group: ['@crypto-force/engine', '@crypto-force/engine/**'],
              message: 'packages/shared must not import packages/engine.',
            },
          ],
        },
      ],
    },
  },

  prettier,
);
