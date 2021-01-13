let syntax = require("@11ty/eleventy-plugin-syntaxhighlight");
let markdown = require("markdown-it");
let markdownLinkAttrs = require("markdown-it-link-attributes");

module.exports = config => {
  config.addPlugin(syntax);
  config.addPassthroughCopy("styles");
  config.addPassthroughCopy("scripts");
  config.addPassthroughCopy("favicon.ico");

  let md = markdown({
    html: true,
    linkify: true,
    breaks: true,
  });

  md.use(markdownLinkAttrs, {
    pattern: /^https?:/,
    attrs: {
      target: "_blank",
      rel: "noopener",
    }
  });

  config.setLibrary("md", md);
}
