let fs = require("fs/promises");
let path = require("path");
let syntax = require("@11ty/eleventy-plugin-syntaxhighlight");
let markdown = require("markdown-it");
let footnotes = require("markdown-it-footnote");
let linkAttrs = require("markdown-it-link-attributes");
let toc = require("markdown-it-table-of-contents");
let attrs = require("markdown-it-attrs");
let anchor = require("markdown-it-anchor");

/**
 * @typedef {import("@11ty/eleventy/src/UserConfig")} EleventyConfig
 */

/**
 * @param {EleventyConfig} eleventyConfig
 */
module.exports = eleventyConfig => {
  eleventyConfig.addPlugin(syntax);
  eleventyConfig.addPlugin(markdownPlugin);
  eleventyConfig.addPlugin(islandsPlugin);
  eleventyConfig.addPassthroughCopy({ "public": "/" });
};

/**
 * @param {EleventyConfig} eleventyConfig
 */
function markdownPlugin(eleventyConfig) {
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

  eleventyConfig.setLibrary("md", md);
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

/**
 * This plugin adds shortcodes for rendering islands of interactive content
 * inside a static page using Preact.
 *
 * The `island` shortcode renders the component at build time, then hydrates it
 * at runtime when the island becomes visible.
 *
 * The `static-island` shortcode renders the component at build time. No
 * JavaScript will be loaded at runtime.
 *
 * The `client-island` shortcode skips the build time rendering and only
 * renders the component at runtime.
 *
 * @param {EleventyConfig} eleventyConfig
 */
function islandsPlugin(eleventyConfig) {
  let counters = {};

  eleventyConfig.on("eleventy.after", () => counters = {});
  eleventyConfig.addAsyncShortcode("island", createIslandShortcode("hydrate"));
  eleventyConfig.addAsyncShortcode("static-island", createIslandShortcode("static"));
  eleventyConfig.addAsyncShortcode("client-island", createIslandShortcode("client"));
  eleventyConfig.addPassthroughCopy("islands");

  /**
   * Liquid templates don't support named arguments which means we have to
   * build our props from a list of names and values.
   * @param {any[]} args
   * @returns {Record<string, any>}
   */
  function argsToProps(args) {
    let props = {};
    for (let i = 0; i < args.length; i += 2) {
      props[args[i]] = args[i + 1];
    }
    return props;
  }

  /**
   * @param {"hydrate" | "static" | "client"} mode
   */
  function createIslandShortcode(mode) {
    return async function(src, ...args) {
      let props = argsToProps(args);
      let html = "";

      // It's important that we use the version of the file inside the islands
      // dir rather than the one inside _site/islands, because there's no
      // guarantee that it will have been copied over before this shortcode
      // runs.
      let file = path.join(__dirname, src);

      if (mode !== "client") {
        // ESM has no `require.cache` that we can use to invalidate an existing
        // file, so instead we'll import it under a new alias if the file has
        // changed.
        let stat = await fs.stat(file);
        let mod = await import(`${file}?v=${stat.mtimeMs}`);

        // Need to use ESM for these preact imports so that this module gets the
        // same instance of preact as the component we're rendering (a commonjs
        // version gets us a different one).
        let { h } = await import("preact");
        let { renderToString } = await import("preact-render-to-string");
        html = renderToString(h(mod.default, props));
      }

      if (mode === "static") {
        return html;
      }

      // Give each island a stable id so that they don't change in the posts
      // that weren't updated. `this.inputPath` is the path of the page
      // Eleventy is currently rendering.
      let id = counters[this.inputPath] ||= 0;
      counters[this.inputPath] += 1;

      return `
<div data-island-id="${id}">${html}</div>
<script async type="module">
  import { h, hydrate } from "preact";
  import component from "${src}";
  let element = document.querySelector(\`[data-island-id="${id}"]\`);
  hydrate(h(component, ${JSON.stringify(props)}), element);
</script>
      `.trim();
    }
  }
}
