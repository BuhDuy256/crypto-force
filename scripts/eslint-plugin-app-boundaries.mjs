import { dirname, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const normalize = (path) => relative(root, path).replaceAll('\\', '/');
const isTest = /(^|\/)(test|tests|e2e|__tests__)(\/|$)|\.(test|spec)\./;
const appSource = /^apps\/(?:[^/]+\/src|web\/app)\//;
const providerPath = /^apps\/api\/src\/providers\//;

function importRule(check, message) {
  return {
    meta: { type: 'problem', schema: [], messages: { boundary: message } },
    create(context) {
      const filename = normalize(context.filename);
      function inspect(node, source) {
        if (typeof source !== 'string') return;
        const target = source.startsWith('.')
          ? normalize(resolve(dirname(context.filename), source))
          : source.startsWith('~/')
            ? `apps/web/app/${source.slice(2)}`
            : source;
        if (check(filename, target)) context.report({ node, messageId: 'boundary' });
      }
      return {
        ImportDeclaration: (node) => inspect(node, node.source.value),
        ExportNamedDeclaration: (node) => inspect(node, node.source?.value),
        ExportAllDeclaration: (node) => inspect(node, node.source.value),
        ImportExpression: (node) => inspect(node, node.source.value),
        CallExpression(node) {
          if (node.callee.name === 'require') inspect(node, node.arguments[0]?.value);
        },
      };
    },
  };
}

export default {
  rules: {
    'no-process-env': {
      meta: {
        type: 'problem',
        schema: [],
        messages: {
          config:
            'Read environment variables in apps/api/src/configs/. Pass configuration to this module.',
        },
      },
      create(context) {
        const memberName = (node) => (node.computed ? node.property.value : node.property.name);
        function isProcess(node, depth = 0) {
          if (!node || depth > 10) return false;
          if (node.type === 'AwaitExpression') return isProcess(node.argument, depth + 1);
          if (node.type === 'MemberExpression')
            return node.object.name === 'globalThis' && memberName(node) === 'process';
          if (node.type === 'ImportExpression') return /^(node:)?process$/.test(node.source.value);
          if (node.type !== 'Identifier') return false;
          let scope = context.sourceCode.getScope(node);
          let variable;
          while (scope && !variable) {
            variable = scope.set.get(node.name);
            scope = scope.upper;
          }
          if (node.name === 'process' && !variable?.defs.length) return true;
          return (
            variable?.defs.some((definition) => {
              if (definition.type === 'ImportBinding')
                return /^(node:)?process$/.test(definition.parent.source.value);
              return definition.type === 'Variable' && isProcess(definition.node.init, depth + 1);
            }) ?? false
          );
        }
        const report = (node) => context.report({ node, messageId: 'config' });
        return {
          MemberExpression(node) {
            if (memberName(node) === 'env' && isProcess(node.object)) report(node);
          },
          VariableDeclarator(node) {
            if (
              node.id.type === 'ObjectPattern' &&
              isProcess(node.init) &&
              node.id.properties.some(
                (property) => (property.key?.name ?? property.key?.value) === 'env',
              )
            )
              report(node);
          },
          ImportDeclaration(node) {
            if (
              /^(node:)?process$/.test(node.source.value) &&
              node.specifiers.some((specifier) => specifier.imported?.name === 'env')
            )
              report(node);
          },
          ExportNamedDeclaration(node) {
            if (
              /^(node:)?process$/.test(node.source?.value) &&
              node.specifiers.some((specifier) => specifier.local.name === 'env')
            )
              report(node);
          },
        };
      },
    },
    'no-test-imports': importRule(
      (file, target) => appSource.test(file) && !isTest.test(file) && isTest.test(target),
      'Move test dependencies out of application source. Use a production interface.',
    ),
    'provider-layers': importRule((file, target) => {
      if (providerPath.test(file)) {
        return /^(?:express(?:\/|$)|drizzle-orm(?:\/|$)|apps\/api\/src\/(?:api|services|repositories|database)\/)/.test(
          target,
        );
      }
      if (!providerPath.test(target)) return false;
      if (/^apps\/api\/src\/(?:api|repositories|database)\//.test(file)) return true;
      return (
        /^apps\/api\/src\/services\//.test(file) &&
        !/^apps\/api\/src\/providers\/market-data\/market-data-provider(?:\.[cm]?js|\.ts)?$/.test(
          target,
        )
      );
    }, 'Keep provider imports within their layers. Services use market-data-provider. Create adapters in the composition root. See docs/conventions/project-structure.md#api-layer-based.'),
  },
};
