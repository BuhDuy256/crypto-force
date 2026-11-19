// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import testware from './scripts/eslint-plugin-testware.mjs';

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

/**
 * A file-scoped `no-restricted-imports` replaces the global one, so every scoped rule
 * re-includes the global patterns through this helper.
 * @param {{ patterns?: object[], paths?: object[] }} [extra]
 */
const restrictImports = ({ patterns = [], paths = [] } = {}) => [
  'error',
  { paths, patterns: [noDeepPackageImports, noAppImports, ...patterns] },
];

const layerDoc = 'See docs/development/project-structure.md#api-layer-based.';

const noDatabaseAccess = {
  regex: '(^|/)(database|repositories)(/|$)|^drizzle-orm',
  message: `Only repositories access the database. Call a service instead. ${layerDoc}`,
};

const noEffectHooks = {
  name: 'react',
  importNames: ['useEffect', 'useLayoutEffect'],
  message:
    'Effects are only allowed inside app/hooks/. Derive values during render, load server state with TanStack Query or route loaders, and handle user actions in event handlers. To sync an imperative library (e.g. Lightweight Charts), write a named hook in app/hooks/.',
};

/** The shadcn CLI resolves the `utils` alias in components.json to the unrelated npm package `cn`. */
const noCnPackage = {
  name: 'cn',
  message:
    'Import cn from "~/utils/cn" (the project helper), not the npm package "cn". After `shadcn add`, fix the import and remove "cn" from apps/web/package.json.',
};

const noEffectProperties = ['useEffect', 'useLayoutEffect'].map((property) => ({
  object: 'React',
  property,
  message: noEffectHooks.message,
}));

// Testware rules (docs/development/coding-guidelines.md#testware).
const testFiles = [
  'apps/*/test/**/*.ts',
  'apps/web/e2e/**/*.ts',
  'packages/*/test/**/*.ts',
  '**/*.test.{ts,tsx}',
  '**/*.spec.ts',
];
const testwareDoc = 'See docs/development/coding-guidelines.md#testware.';

const noAppSourceInSystemTests = {
  regex: '^(\\.\\./)+app/|^~/|^@crypto-force/(web|api|worker)',
  message: `System tests check the app from outside: take expected values from the requirement, not from app source. If no user action reaches the state a test needs, change the test environment in apps/web/e2e/environment.ts. ${testwareDoc}`,
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.react-router/**',
      'apps/api/drizzle/**',
      // Test reports (gitignored); Playwright copies its trace viewer scripts into them.
      '**/playwright-report/**',
      '**/test-results/**',
      'docs/**',
      // Vendored third-party skill (see its UPSTREAM.md); not project code.
      '.claude/skills/shadcn/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
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
      'no-restricted-imports': restrictImports(),
      // Unfinished work belongs in the task tracker, not in a comment the next agent copies.
      'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'hack', 'xxx'] }],
    },
  },

  {
    files: ['*.js', '**/*.config.{js,ts}', '.claude/hooks/*.mjs', 'scripts/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Node.js runtimes
  {
    files: [
      'apps/api/**/*.ts',
      'apps/worker/**/*.ts',
      '*.js',
      '**/*.config.{js,ts}',
      '.claude/hooks/*.mjs',
      'scripts/*.mjs',
    ],
    languageOptions: { globals: globals.node },
  },

  // API layers (docs/development/project-structure.md#api-layer-based)
  {
    files: ['apps/api/src/api/routes/**/*.ts', 'apps/api/src/api/controllers/**/*.ts'],
    rules: { 'no-restricted-imports': restrictImports({ patterns: [noDatabaseAccess] }) },
  },
  {
    files: ['apps/api/src/services/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictImports({
        patterns: [
          {
            regex: '(^|/)database(/|$)|^drizzle-orm',
            message: `Services must not query the database directly; use a repository. ${layerDoc}`,
          },
          {
            regex: '^express$|(^|/)api/',
            message: `Services must not depend on Express or HTTP layers; return plain results. ${layerDoc}`,
          },
        ],
      }),
    },
  },
  {
    files: ['apps/api/src/repositories/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictImports({
        patterns: [
          {
            regex: '^express$|(^|/)(api|services)/',
            message: `Repositories only do data access; no HTTP handling or business rules. ${layerDoc}`,
          },
        ],
      }),
    },
  },

  // Frontend
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['apps/web/app/**/*.{ts,tsx}'],
    ignores: ['apps/web/app/hooks/**'],
    rules: {
      'no-restricted-imports': restrictImports({ paths: [noEffectHooks, noCnPackage] }),
      'no-restricted-properties': ['error', ...noEffectProperties],
      // React Router renders a thrown `data(..., { status })` in the route ErrorBoundary.
      '@typescript-eslint/only-throw-error': [
        'error',
        { allow: [{ from: 'package', package: 'react-router', name: 'DataWithResponseInit' }] },
      ],
    },
  },
  {
    files: [
      'apps/web/app/components/**/*.{ts,tsx}',
      'apps/web/app/layouts/**/*.{ts,tsx}',
      'apps/web/app/pages/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': restrictImports({
        paths: [noEffectHooks, noCnPackage],
        patterns: [
          {
            regex: '^~/api(/|$)|(^|/)api(/|$)',
            message:
              'UI components must not call the HTTP API directly. Load data in a route loader or a hook in app/hooks/ and pass it down. See docs/development/coding-guidelines.md#frontend-react-router-và-server-state.',
          },
        ],
      }),
    },
  },

  // Testware: long-lived names a new maintainer can read, and checks that can fail.
  {
    files: testFiles,
    plugins: { testware },
    rules: {
      'testware/no-scope-in-path': 'error',
      'testware/no-stlc-ids': 'error',
      'testware/no-implementation-oracle': 'error',
      'testware/no-app-module-mocks': 'error',
      'testware/exact-status-oracle': 'error',
      'testware/no-app-constants': 'error',
    },
  },
  // System tests: no app source. Playwright has no assertion count (Vitest uses
  // expect.requireAssertions), so lint requires an expect() in each test body.
  {
    files: ['apps/web/e2e/**/*.ts'],
    rules: {
      'testware/require-expect': 'error',
      'no-restricted-imports': restrictImports({ patterns: [noAppSourceInSystemTests] }),
    },
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
