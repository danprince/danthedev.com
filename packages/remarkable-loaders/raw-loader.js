// Copy of raw-loader that exports as commonjs, so that the result will
// be returned directly from `require` calls in the templates.

module.exports = function rawLoader(source) {
  const json = JSON.stringify(source)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  return `module.exports = ${json};`;
}
