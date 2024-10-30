// @ts-nocheck (Eleventy doesn't have types)

import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.setLibrary("md", markdown());
  eleventyConfig.addPassthroughCopy("style.css");
  eleventyConfig.addPassthroughCopy("favicon.svg");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("audio");

  // Turn off dom diffing so that reloads don't unset the colour theme.
  eleventyConfig.setServerOptions({ domDiff: false });
}

function markdown() {
  let mdLib = markdownIt({ html: true, breaks: true, linkify: true });
  mdLib.use(externalLinks);
  mdLib.use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.headerLink(),
  });
  return;
}

/**
 * Add a target=_blank to all external links.
 */
function externalLinks(mdLib) {
  mdLib.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    let token = tokens[idx];
    let href = token.attrGet("href");
    let isRelative = /^[/.#]/.test(href);

    if (!isRelative) {
      token.attrSet("target", "_blank");
    }

    return self.renderToken(tokens, idx, options);
  };
}
