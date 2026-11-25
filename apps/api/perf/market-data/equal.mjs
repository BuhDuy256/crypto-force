export function equalValues(actual, expected) {
  if (actual === expected) return true;
  if (
    actual === null ||
    expected === null ||
    typeof actual !== 'object' ||
    typeof expected !== 'object'
  )
    return false;
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  const keys = Object.keys(expected);
  return (
    Object.keys(actual).length === keys.length &&
    keys.every((key) => Object.hasOwn(actual, key) && equalValues(actual[key], expected[key]))
  );
}
