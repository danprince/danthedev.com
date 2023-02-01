let syntax = require("@11ty/eleventy-plugin-syntaxhighlight");
let markdown = require("markdown-it");
let linkAttrs = require("markdown-it-link-attributes");
let toc = require("markdown-it-table-of-contents");
let attrs = require("markdown-it-attrs");
let anchor = require("markdown-it-anchor");
let islands = require("./_11ty/islands.cjs");

module.exports = config => {
  config.addPlugin(syntax);
  config.addPlugin(islands);
  config.setTemplateFormats(["md"]);
  config.addPassthroughCopy({ "public": "/" });

  config.addWatchTarget("./src");
  config.setWatchThrottleWaitTime(300);

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

/**
 * @param {string} str 
 * @returns {string}
 */
function slugify(str) {
  return str
    .replace(/ & /g, " and ")
    .replace(/[']/g, "")
    .replace(/[^\w]+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}
