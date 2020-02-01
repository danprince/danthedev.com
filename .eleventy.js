let syntax = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = config => {
  config.addPlugin(syntax);
  config.addPassthroughCopy("styles");
  config.addPassthroughCopy("scripts");
  config.addPassthroughCopy("favicon.ico");
}
