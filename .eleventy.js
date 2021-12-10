let syntax = require("@11ty/eleventy-plugin-syntaxhighlight");
let markdown = require("markdown-it");
let linkAttrs = require("markdown-it-link-attributes");
let attrs = require("markdown-it-attrs");
let anchor = require("markdown-it-anchor");

module.exports = config => {
  config.addPlugin(syntax);

  config.addPassthroughCopy({ "public": "/" })

  // These files will be copied through in-place
  config.setTemplateFormats(["md", "css", "js"]);

  config.addFilter("filterBySeries", (posts, series) => {
    return posts.filter(post => {
      return (
        post.data.series === series &&
        post.data.index !== true
      );
    });
  });

  let md = markdown({
    html: true,
    linkify: true,
    breaks: true,
  });

  md.use(anchor, {
    permalink: anchor.permalink.headerLink({
      class: "permalink"
    }),
    slugify: title => title
      .replace(/ & /g, " and ")
      .replace(/[']/g, "")
      .replace(/[^\w]+/g, " ")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase(),
  });

  md.use(attrs);

  md.use(linkAttrs, {
    pattern: /^https?:/,
    attrs: {
      target: "_blank",
      rel: "noopener",
    }
  });

  config.setLibrary("md", md);
}