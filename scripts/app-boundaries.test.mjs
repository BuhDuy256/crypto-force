// Checks the application boundaries with the repository ESLint configuration.
// Run: node --test scripts/app-boundaries.test.mjs.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

const eslint = new ESLint({ overrideConfig: [tseslint.configs.disableTypeChecked] });

async function errors(filePath, code) {
  const results = await eslint.lintText(code, { filePath });
  return results.flatMap((result) => result.messages).filter((message) => message.severity === 2);
}

test('provider layers accept interface imports and reject forbidden dependencies', async () => {
  const provider = 'apps/api/src/providers/market-data/binance.provider.ts';
  const service = 'apps/api/src/services/market-data.service.ts';
  for (const [file, source] of [
    [service, '../providers/market-data/market-data-provider'],
    [provider, '@crypto-force/shared'],
    [provider, '../../configs/env'],
    ['apps/api/src/index.ts', './providers/market-data/binance.provider'],
  ]) {
    assert.deepEqual(await errors(file, `import '${source}';`), []);
  }
  for (const [file, source] of [
    [service, '../providers/market-data/binance.provider'],
    [service, '../providers/market-data/cached-market-data.provider'],
    [
      'apps/api/src/api/controllers/market-data.controller.ts',
      '../../providers/market-data/market-data-provider',
    ],
    [
      'apps/api/src/api/routes/market-data.route.ts',
      '../../providers/market-data/binance.provider',
    ],
    [
      'apps/api/src/repositories/market-data.repository.ts',
      '../providers/market-data/market-data-provider',
    ],
    ['apps/api/src/database/market-data.ts', '../providers/market-data/binance.provider'],
    ...[
      'express',
      'drizzle-orm',
      '../../services/market-data.service',
      '../../api/routes/index',
      '../../repositories/user.repository',
      '../../database/schema',
    ].map((source) => [provider, source]),
  ]) {
    for (const code of [
      `import '${source}';`,
      `void import('${source}');`,
      `export * from '${source}';`,
      `require('${source}');`,
    ]) {
      assert.ok(
        (await errors(file, code)).some(
          (message) => message.ruleId === 'app-boundaries/provider-layers',
        ),
        `${file}: ${code}`,
      );
    }
  }
});

test('application source rejects test imports and permits colocated tests', async () => {
  for (const file of [
    'apps/api/src/services/market-data.service.ts',
    'apps/worker/src/index.ts',
    'apps/web/app/root.tsx',
  ]) {
    assert.deepEqual(await errors(file, "import '@crypto-force/shared';"), []);
    for (const source of [
      '../../test/fixture',
      '../../e2e/fixture',
      './example.test.ts',
      '~/utils/example.spec.ts',
    ]) {
      for (const code of [
        `import '${source}';`,
        `void import('${source}');`,
        `export * from '${source}';`,
        `require('${source}');`,
      ]) {
        assert.ok(
          (await errors(file, code)).some(
            (message) => message.ruleId === 'app-boundaries/no-test-imports',
          ),
          `${file}: ${code}`,
        );
      }
    }
  }
  assert.deepEqual(
    await errors('apps/web/app/utils/example.test.ts', "import './fixture.test';"),
    [],
  );
});

test('API configuration owns environment access and shutdown can use process', async () => {
  assert.deepEqual(await errors('apps/api/src/configs/env.ts', 'void process.env;'), []);
  assert.deepEqual(await errors('apps/api/src/index.ts', 'process.exit(0);'), []);
  assert.deepEqual(
    await errors('apps/api/src/index.ts', "const data = { env: 'value' }; void data.env;"),
    [],
  );
  for (const file of [
    'apps/api/src/index.ts',
    'apps/api/src/services/market-data.service.ts',
    'apps/api/src/providers/market-data/binance.provider.ts',
  ]) {
    for (const code of [
      'void process.env;',
      "void process['env'];",
      'const { env } = process; void env;',
      "import { env } from 'node:process'; void env;",
      "import { env as config } from 'process'; void config;",
      "import runtime from 'node:process'; void runtime.env;",
      'const runtime = process; void runtime.env;',
      'void globalThis.process.env;',
    ]) {
      assert.ok(
        (await errors(file, code)).some(
          (message) => message.ruleId === 'app-boundaries/no-process-env',
        ),
        `${file}: ${code}`,
      );
    }
  }
});
