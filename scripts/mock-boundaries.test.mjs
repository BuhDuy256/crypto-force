// Checks HTTP mock import boundaries with the real ESLint config and lintText in Node.js.
// Run: pnpm check:rules. Expected boundaries: docs/conventions/code.md#http-mocking.
// Fault evidence: disabling no-restricted-syntax made both tests fail on forbidden imports.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ESLint } from 'eslint';

const eslint = new ESLint();

test('application modules reject static, dynamic and re-exported mock dependencies', async () => {
  for (const filePath of [
    'apps/web/app/root.tsx',
    'apps/web/app/hooks/useAuth.ts',
    'apps/web/app/api/auth.ts',
  ]) {
    for (const code of [
      "import { handlers } from '../../mocks/handlers';",
      "const mock = import('../../mocks/browser');",
      "export * from '../../mocks/handlers';",
      "import { http } from 'msw';",
      "const mock = require('../../mocks/browser');",
    ]) {
      const results = await eslint.lintText(code, { filePath });
      assert.ok(
        results.some((result) =>
          result.messages.some((message) => message.ruleId === 'no-restricted-syntax'),
        ),
        `${filePath} must reject ${code}`,
      );
    }
  }
});

test('the browser entry can import mock bootstrap but cannot import MSW directly', async () => {
  const filePath = 'apps/web/app/entry.client.tsx';
  const allowed = await eslint.lintText("const mock = import('../mocks/browser');", { filePath });
  assert.ok(
    allowed.every((result) =>
      result.messages.every((message) => message.ruleId !== 'no-restricted-syntax'),
    ),
  );
  const rejected = await eslint.lintText("import { setupWorker } from 'msw/browser';", {
    filePath,
  });
  assert.ok(
    rejected.some((result) =>
      result.messages.some((message) => message.ruleId === 'no-restricted-syntax'),
    ),
  );
});
