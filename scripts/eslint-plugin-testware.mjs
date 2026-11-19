// ESLint rules for test code (docs/development/coding-guidelines.md#testware). Each message tells
// the agent how to fix the test, because an agent reads only the message and the file.
import { dirname, relative, resolve } from 'node:path';
import { requirementPrefixes, templatePrefixes } from './test-scope-ids.mjs';

const testwareDoc = 'See docs/development/coding-guidelines.md#testware.';

/**
 * IDs of the STLC documents (PROC-01, MD-05, DR-07, SEC-04, TS-001 ...). TC-xxx stays allowed, and
 * so does an ID inside a file path, because a reader can open the path.
 */
const stlcIdPattern = new RegExp(
  `(?<![/\\w-])(?:${[...templatePrefixes().keys(), ...requirementPrefixes(), 'TS']
    .filter((prefix) => prefix !== 'TC')
    .join('|')})-\\d[\\w.-]*`,
);
const scopeInPath = /(^|[\\/])ts-?\d{3}([-_./\\]|$)/i;

/** The repository root. Paths are tested relative to it, so a checkout under /home/u/test/ works. */
const repoRoot = resolve(import.meta.dirname, '..');

/** @param {string} path @returns {string} */
const fromRoot = (path) => relative(repoRoot, path).replaceAll('\\', '/');

/** A path inside test code: a test, spec or fixtures file, or a test, e2e or support folder. */
const testPath = /(^|\/)(test|tests|e2e|__tests__)(\/|$)|\.(test|spec)(\.[cm]?[jt]sx?)?$/;

/**
 * True when `specifier` names app or package source, not test code or a third-party package.
 * @param {string} specifier @param {string} filename
 */
function isAppSource(specifier, filename) {
  if (specifier.startsWith('~/') || specifier.startsWith('@crypto-force/')) return true;
  if (!specifier.startsWith('.')) return false;
  const target = fromRoot(resolve(dirname(filename), specifier));
  return !target.startsWith('../') && !testPath.test(target);
}

/**
 * @typedef {import('eslint').Rule.RuleContext} Context
 * @typedef {import('estree').Node} Node
 * @typedef {import('eslint').Scope.Variable} Variable
 */

/** @param {Context} context @param {import('estree').Identifier} node @returns {Variable | undefined} */
function findVariable(context, node) {
  /** @type {import('eslint').Scope.Scope | null} */
  let scope = context.sourceCode.getScope(node);
  while (scope) {
    const variable = scope.set.get(node.name);
    if (variable) return variable;
    scope = scope.upper;
  }
  return undefined;
}

/**
 * The app-source import that `node` reads, directly or through `const` aliases, or undefined.
 * @param {Context} context @param {import('estree').Identifier} node @param {number} [depth]
 * @returns {{ name: string, source: string } | undefined}
 */
function appImportOf(context, node, depth = 0) {
  const definition = findVariable(context, node)?.defs[0];
  if (!definition || depth > 3) return undefined;
  if (definition.type === 'ImportBinding') {
    const declaration = /** @type {any} */ (definition.parent);
    const specifier = /** @type {any} */ (definition.node);
    if (declaration.importKind === 'type' || specifier.importKind === 'type') return undefined;
    const source = String(declaration.source.value);
    return isAppSource(source, context.filename) ? { name: node.name, source } : undefined;
  }
  const declarator = /** @type {any} */ (definition.node);
  if (definition.type === 'Variable' && definition.parent.kind === 'const' && declarator.init) {
    for (const identifier of identifiersIn(declarator.init)) {
      const found = appImportOf(context, identifier, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

/** Identifiers that `node` reads as values (not property names or types). @param {any} node */
function* identifiersIn(node) {
  if (!node || typeof node.type !== 'string' || node.type.startsWith('TSType')) return;
  if (node.type === 'Identifier') {
    yield node;
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent' || key === 'typeAnnotation' || key === 'typeArguments') continue;
    if (key === 'property' && node.type === 'MemberExpression' && !node.computed) continue;
    if (key === 'key' && node.type === 'Property' && !node.computed) continue;
    for (const child of Array.isArray(value) ? value : [value]) yield* identifiersIn(child);
  }
}

/** Removes `await`, `!`, `as` and `?.` wrappers. @param {any} node */
function unwrap(node) {
  let current = node;
  while (
    ['AwaitExpression', 'TSNonNullExpression', 'TSAsExpression', 'ChainExpression'].includes(
      current?.type,
    )
  ) {
    current = current.type === 'AwaitExpression' ? current.argument : current.expression;
  }
  return current;
}

/**
 * For a matcher call such as `expect(a).not.toBe(b)`: the `expect(...)` call, the matcher name and
 * whether `.not` is in the chain. Undefined for any other call.
 * @param {any} node
 */
function matcherCall(node) {
  if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression') return undefined;
  if (node.callee.computed || node.callee.property.type !== 'Identifier') return undefined;
  let negated = false;
  let object = node.callee.object;
  while (object.type === 'MemberExpression' && !object.computed) {
    if (object.property.name === 'not') negated = true;
    object = object.object;
  }
  if (object.type !== 'CallExpression') return undefined;
  const callee = object.callee;
  const isExpect =
    (callee.type === 'Identifier' && callee.name === 'expect') ||
    (callee.type === 'MemberExpression' &&
      callee.object.type === 'Identifier' &&
      callee.object.name === 'expect');
  if (!isExpect) return undefined;
  return { expectCall: object, matcher: node.callee.property.name, negated };
}

/** The root identifier of `a.b.c` when the chain has no call in it. @param {any} node */
function rootOfMemberChain(node) {
  let current = unwrap(node);
  while (current?.type === 'MemberExpression') current = unwrap(current.object);
  return current?.type === 'Identifier' ? current : undefined;
}

/** Matchers whose argument is a type or an error class, which is part of a contract. */
const typeMatchers = new Set(['toBeInstanceOf', 'toThrow', 'toThrowError']);

/** @type {import('eslint').Rule.RuleModule} */
const noImplementationOracle = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      CallExpression(node) {
        const call = matcherCall(node);
        if (!call) return;
        const subject = call.expectCall.arguments[0];
        const root = rootOfMemberChain(subject);
        const constant = root && appImportOf(context, root);
        if (constant) {
          context.report({
            node: subject,
            message: `This test checks "${constant.name}" from ${constant.source}, a value in the code, not a behavior. The test still passes when the behavior breaks, and fails when the code is only reorganized. Call the code with an input and check the result, e.g. expect(getSafeNext('//evil.example')).toBe('/realtime'). ${testwareDoc}`,
          });
        }
        if (typeMatchers.has(call.matcher)) return;
        for (const argument of node.arguments) {
          for (const identifier of identifiersIn(argument)) {
            const found = appImportOf(context, identifier);
            if (!found) continue;
            context.report({
              node: identifier,
              message: `The expected value comes from the code under test ("${found.name}" from ${found.source}). If that code is wrong, the expected value is wrong in the same way, and the test still passes. Write the expected value as a literal from the test case or requirement, e.g. .toBe('/realtime'). ${testwareDoc}`,
            });
            return;
          }
        }
      },
    };
  },
};

/** @type {import('eslint').Rule.RuleModule} */
const noAppModuleMocks = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    const message = (/** @type {string} */ what) =>
      `Do not replace ${what} in a test. The mock copies how the code is split into modules, so the test fails when the code is only reorganized, and passes when the real module breaks. Replace only a boundary: give the code a fake through its parameters (mailer, logger, clock), or add a fake for the host in apps/api/test/support/outbound.ts. ${testwareDoc}`;
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'MemberExpression' || callee.computed) return;
        if (callee.object.type !== 'Identifier' || callee.object.name !== 'vi') return;
        if (callee.property.type !== 'Identifier') return;
        const [first] = node.arguments;
        if (!first) return;
        if (['mock', 'doMock'].includes(callee.property.name)) {
          const target = first.type === 'ImportExpression' ? first.source : first;
          const path =
            target.type === 'Literal' && typeof target.value === 'string'
              ? target.value
              : target.type === 'TemplateLiteral' && target.expressions.length === 0
                ? (target.quasis[0]?.value.cooked ?? '')
                : '';
          if (path && isAppSource(path, context.filename)) {
            context.report({ node, message: message(`the app module ${path}`) });
          }
        }
        if (callee.property.name === 'spyOn') {
          const root = rootOfMemberChain(first);
          const found = root && appImportOf(context, root);
          if (found) {
            context.report({
              node,
              message: message(`a function of ${found.source} ("${found.name}")`),
            });
          }
        }
      },
    };
  },
};

/** Names of an HTTP status: `status` (fetch, Playwright) and `statusCode` (node:http). */
const statusNames = new Set(['status', 'statusCode']);

/** `x.status`, `x.status()`, `x.statusCode` or a variable with such a name. @param {any} node */
function isStatus(node) {
  const value = unwrap(node);
  if (value?.type === 'Identifier') return statusNames.has(value.name);
  const target = value?.type === 'CallExpression' ? value.callee : value;
  return (
    target?.type === 'MemberExpression' &&
    !target.computed &&
    target.property.type === 'Identifier' &&
    statusNames.has(target.property.name)
  );
}

/** @param {any} node */
const isNumber = (node) => node?.type === 'Literal' && typeof node.value === 'number';

/** True when a status comparison only decides which code runs (`if (status !== 200) throw`). */
function isGuard(/** @type {any} */ node) {
  let child = node;
  let parent = node.parent;
  while (parent?.type === 'LogicalExpression' || parent?.type === 'UnaryExpression') {
    child = parent;
    parent = parent.parent;
  }
  return (
    ['IfStatement', 'ConditionalExpression', 'WhileStatement'].includes(parent?.type) &&
    parent.test === child
  );
}

/** True when `node` is inside the first argument of an `expect(...)` call. @param {any} node */
function insideExpectSubject(node) {
  let child = node;
  for (let parent = node.parent; parent; child = parent, parent = parent.parent) {
    if (
      parent.type === 'CallExpression' &&
      parent.callee.type === 'Identifier' &&
      parent.callee.name === 'expect'
    ) {
      return parent.arguments[0] === child;
    }
  }
  return false;
}

const rangeMatchers = new Set([
  'toBeLessThan',
  'toBeLessThanOrEqual',
  'toBeGreaterThan',
  'toBeGreaterThanOrEqual',
  'toBeOneOf',
]);
const equalityMatchers = new Set(['toBe', 'toEqual', 'toStrictEqual']);

/** @type {import('eslint').Rule.RuleModule} */
const exactStatusOracle = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    const weak = `This check only tells what the HTTP status is not, or gives a range. A 500 or a 404 also passes it, so the test passes while the behavior is broken. Assert the exact status that the test case gives for this input, e.g. expect(response.status).toBe(401) for a wrong password, and check the body or the side effect when the test case names one. ${testwareDoc}`;
    return {
      BinaryExpression(node) {
        const [status, other] = isStatus(node.left)
          ? [node.left, node.right]
          : [node.right, node.left];
        if (!isStatus(status) || !isNumber(other) || isGuard(node)) return;
        if (['!==', '!=', '<', '<=', '>', '>='].includes(node.operator)) {
          context.report({ node, message: weak });
          return;
        }
        const callback = /** @type {any} */ (node).parent;
        const mapCall = callback?.parent;
        const isMapResult =
          ['ArrowFunctionExpression', 'FunctionExpression'].includes(callback?.type) &&
          mapCall?.type === 'CallExpression' &&
          mapCall.callee.type === 'MemberExpression' &&
          !mapCall.callee.computed &&
          mapCall.callee.property.name === 'map' &&
          insideExpectSubject(node);
        if (isMapResult) {
          context.report({
            node,
            message: `This check turns each status into true or false, so "false" passes for a 500 as well as for the status the test case expects. Compare the statuses themselves, e.g. expect(statuses).toEqual([401, 401, 401, 429, 429]). ${testwareDoc}`,
          });
        }
      },
      CallExpression(node) {
        const call = matcherCall(node);
        if (!call) return;
        const value = unwrap(call.expectCall.arguments[0]);
        // `response.ok` (fetch) or `response.ok()` (Playwright).
        const subject = value?.type === 'CallExpression' ? value.callee : value;
        if (
          subject?.type === 'MemberExpression' &&
          !subject.computed &&
          subject.property.type === 'Identifier' &&
          subject.property.name === 'ok'
        ) {
          context.report({
            node,
            message: `response.ok is true for each status from 200 to 299, so this check passes for a status that the test case does not give. Assert the exact status, e.g. expect(response.status).toBe(200). ${testwareDoc}`,
          });
          return;
        }
        if (!isStatus(call.expectCall.arguments[0])) return;
        const negatedEquality = call.negated && equalityMatchers.has(call.matcher);
        if (negatedEquality || rangeMatchers.has(call.matcher)) {
          context.report({ node, message: weak });
        }
      },
    };
  },
};

/** A constant name such as DEFAULT_DESTINATION or SIGN_IN_RATE_LIMIT. */
const constantName = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

/** @param {string} name @param {string} source */
const constantMessage = (name, source) =>
  `"${name}" from ${source} is a value in the code under test. A test that reads it follows the code: when the value is wrong, the input or the expected value is wrong in the same way, and the test still passes. Write the value from the test case or requirement as a literal in the test, e.g. const limit = 3. ${testwareDoc}`;

/** @type {import('eslint').Rule.RuleModule} */
const noAppConstants = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);
        if (/** @type {any} */ (node).importKind === 'type') return;
        if (!isAppSource(source, context.filename)) return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') continue;
          if (/** @type {any} */ (specifier).importKind === 'type') continue;
          const name =
            specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : String(specifier.imported.value);
          if (name.length > 1 && constantName.test(name)) {
            context.report({ node: specifier, message: constantMessage(name, source) });
          }
        }
      },
      MemberExpression(node) {
        if (node.computed || node.property.type !== 'Identifier') return;
        if (node.object.type !== 'Identifier') return;
        const name = node.property.name;
        if (name.length < 2 || !constantName.test(name)) return;
        const found = appImportOf(context, node.object);
        if (found) context.report({ node, message: constantMessage(name, found.source) });
      },
    };
  },
};

/** An assertion helper: a function whose name starts with "expect", e.g. expectFieldError. */
const expectHelperName = /^expect[A-Z]/;

/**
 * True when `node` is `expect(...)`, `expect.soft(...)`, `expect.poll(...)` or, unless
 * `strict`, a call to an assertion helper.
 * @param {any} node @param {boolean} strict
 */
function isExpectCall(node, strict) {
  if (node?.type !== 'CallExpression') return false;
  const callee = node.callee;
  if (callee.type === 'Identifier') {
    return callee.name === 'expect' || (!strict && expectHelperName.test(callee.name));
  }
  return (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'expect'
  );
}

/**
 * True when the subtree has an `expect` call (with `strict`, a helper call does not count).
 * @param {any} node @param {boolean} [strict] @returns {boolean}
 */
function hasExpect(node, strict = false) {
  if (!node || typeof node.type !== 'string') return false;
  if (isExpectCall(node, strict)) return true;
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') continue;
    for (const child of Array.isArray(value) ? value : [value]) {
      if (child && typeof child === 'object' && hasExpect(child, strict)) return true;
    }
  }
  return false;
}

/**
 * True when the body skips the test with no condition: test.skip(), test.skip(true, reason) or
 * test.fixme(). A skipped test reports "skipped", not "passed".
 * @param {any} body
 */
function skipsAlways(body) {
  const statements = body.type === 'BlockStatement' ? body.body : [];
  return statements.some((/** @type {any} */ statement) => {
    const call = statement.type === 'ExpressionStatement' ? statement.expression : undefined;
    if (call?.type !== 'CallExpression') return false;
    const name = calleeName(call.callee);
    if (name !== 'test.skip' && name !== 'test.fixme') return false;
    const first = call.arguments[0];
    return !first || (first.type === 'Literal' && first.value === true);
  });
}

/** Test calls that run a body: test(), test.only(), test.fail(), it(), it.only(). */
const testCallees = new Set(['test', 'it', 'test.only', 'test.fail', 'it.only']);

/** @param {any} callee */
function calleeName(callee) {
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression' && !callee.computed && callee.object.type === 'Identifier')
    return `${callee.object.name}.${callee.property.name}`;
  return '';
}

/** @type {import('eslint').Rule.RuleModule} */
const requireExpect = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    /** @param {any} node @param {string} name @param {any} fn */
    const checkHelper = (node, name, fn) => {
      if (!expectHelperName.test(name) || hasExpect(fn.body, true)) return;
      context.report({
        node,
        message: `"${name}" is named as an assertion helper, but it has no expect() in it. A test that calls it then checks nothing. Add the expect() calls to the helper, or rename it so that its name does not start with "expect". ${testwareDoc}`,
      });
    };
    return {
      CallExpression(node) {
        if (!testCallees.has(calleeName(node.callee))) return;
        const body = node.arguments.at(-1);
        if (body?.type !== 'ArrowFunctionExpression' && body?.type !== 'FunctionExpression') return;
        if (hasExpect(body.body) || skipsAlways(body.body)) return;
        context.report({
          node: node.callee,
          message: `This test has no expect() in its body, so it passes when the app is wrong. Assert the expected result of the test case in the test, e.g. await expect(page).toHaveURL('/realtime'). To put the assertions in a helper, give the helper a name that starts with "expect", e.g. expectExpiredScreen(page), so the reader sees that the call checks something. ${testwareDoc}`,
        });
      },
      FunctionDeclaration(node) {
        if (node.id) checkHelper(node.id, node.id.name, node);
      },
      VariableDeclarator(node) {
        const init = /** @type {any} */ (node.init);
        if (node.id.type !== 'Identifier') return;
        if (init?.type !== 'ArrowFunctionExpression' && init?.type !== 'FunctionExpression') return;
        checkHelper(node.id, node.id.name, init);
      },
    };
  },
};

/** @type {import('eslint').ESLint.Plugin} */
export default {
  rules: {
    'no-scope-in-path': {
      meta: { type: 'problem', schema: [] },
      create(context) {
        return {
          Program(node) {
            const path = fromRoot(context.filename);
            if (!scopeInPath.test(path)) return;
            context.report({
              node,
              message: `This test file path names a test scope (${path}). Tests outlive one test scope: name the file and folder after the feature, e.g. apps/api/test/auth/session.test.ts. ${testwareDoc}`,
            });
          },
        };
      },
    },
    'no-stlc-ids': {
      meta: { type: 'problem', schema: [] },
      create(context) {
        /** @param {import('estree').Node | import('estree').Comment} node @param {string} text */
        const check = (node, text) => {
          const match = stlcIdPattern.exec(text);
          if (!match) return;
          const loc = node.loc ?? undefined;
          context.report({
            ...(loc ? { loc } : { node: /** @type {import('estree').Node} */ (node) }),
            message: `"${match[0]}" is an ID from the STLC documents. A reader of the test does not know it: say in plain words what the test checks and how. Keep only the test case ID (TC-xxx) at the start of the test title. ${testwareDoc}`,
          });
        };
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments())
              check(comment, comment.value);
          },
          Literal(node) {
            if (typeof node.value === 'string') check(node, node.value);
          },
          TemplateElement(node) {
            check(node, node.value.raw);
          },
        };
      },
    },
    'no-implementation-oracle': noImplementationOracle,
    'no-app-module-mocks': noAppModuleMocks,
    'exact-status-oracle': exactStatusOracle,
    'no-app-constants': noAppConstants,
    'require-expect': requireExpect,
  },
};
