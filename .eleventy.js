let syntax = require("@11ty/eleventy-plugin-syntaxhighlight");
let markdown = require("markdown-it");
let footnotes = require("markdown-it-footnote");
let linkAttrs = require("markdown-it-link-attributes");
let toc = require("markdown-it-table-of-contents");
let attrs = require("markdown-it-attrs");
let anchor = require("markdown-it-anchor");

/**
 * @param {import("@11ty/eleventy/src/UserConfig")} config
 */
module.exports = config => {
  config.addPlugin(syntax);

  config.addPassthroughCopy({ "public": "/" })

  // These files will be copied through in-place
  config.setTemplateFormats(["md", "css"]);

  let md = markdown({
    html: true,
    linkify: true,
    breaks: true,
  });

  md.use(anchor, {
    permalink: anchor.permalink.linkInsideHeader({
      symbol: "#",
      class: "permalink",
      placement: "after",
    }),
    slugify,
  });

  md.use(attrs);
  md.use(footnotes);

  md.use(linkAttrs, {
    pattern: /^https?:/,
    attrs: {
      target: "_blank",
      rel: "noopener",
    }
  });

  md.use(toc, {
    slugify,
    includeLevel: [2,3]
  });

  config.setLibrary("md", md);
}

function slugify(str) {
  return str
    .replace(/ & /g, " and ")
    .replace(/[']/g, "")
    .replace(/[^\w]+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}
