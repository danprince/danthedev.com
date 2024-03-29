let fs = require("fs/promises");
let path = require("path");
let syntax = require("@11ty/eleventy-plugin-syntaxhighlight");
let markdown = require("markdown-it");
let footnotes = require("markdown-it-footnote");
let linkAttrs = require("markdown-it-link-attributes");
let toc = require("markdown-it-table-of-contents");
let attrs = require("markdown-it-attrs");
let anchor = require("markdown-it-anchor");
let worker = require("./islands.worker.cjs");

/**
 * @typedef {import("@11ty/eleventy").UserConfig} EleventyConfig
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
  /**
   * @typedef {object} Typecheck
   * A typecheck is a single instance of an island shortcode that we can render
   * into a TypeScript file to check that there are no type errors.
   * @property {string} src Path to import the file from
   * @property {string} name Name of the export to use
   * @property {Record<string, any>} props Component props
   * @property {string} file File where the island was rendered
   */

  /** @type {Record<string, number>} */
  let counters = {};

  /** @type {Typecheck[]} */
  let typechecks = [];

  // During development we only need to reset the worker, but during production
  // builds, the worker has to be closed for the node process to exit properly.
  eleventyConfig.on("eleventy.before", () => worker.resetWorker());
  eleventyConfig.on("eleventy.after", () => worker.closeWorker());

  eleventyConfig.on("eleventy.after", () => counters = {});
  eleventyConfig.on("eleventy.after", emitTypeChecks);
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
    /**
     * @param {string | { src: string, export: string }} src
     * @param {any[]} args
     */
    return async function(src, ...args) {
      let name = "default";
      let props = argsToProps(args);
      let inputPath = this.page.inputPath;
      let html = "";

      // Handle imports with named exports
      if (typeof src === "object") {
        name = src.export;
        src = src.src;
      }

      // It's important that we use the version of the file inside the islands
      // dir rather than the one inside _site/islands, because there's no
      // guarantee that it will have been copied over before this shortcode
      // runs.
      let file = path.join(__dirname, src);

      // Add this to our typechecking file to make sure the types are right.
      typechecks.push({ src, props, name: name, file: inputPath });

      if (mode !== "client") {
        html = await worker.renderToStringWithWorker({ file, name, props });
      }

      if (mode === "static") {
        return html;
      }

      // Give each island a stable id so that they don't change in the posts
      // that weren't updated. `inputPath` is the path of the page Eleventy
      // is currently rendering.
      let id = counters[inputPath] ||= 0;
      counters[inputPath] += 1;

      return `
<div data-island-id="${id}">${html}</div>
<script async type="module">
  import { h, ${mode === "hydrate" ? "hydrate as " : "" }render } from "preact";
  import { ${name} as component } from "${src}";
  let element = document.querySelector('[data-island-id="${id}"]');
  render(h(component, ${JSON.stringify(props)}), element);
</script>
      `.trim();
    }
  }

  /**
   * There no type safety for the callsites of islands when they're written
   * inside markdown as liquid shortcodes. This function translates all of
   * the calls from the current build into actual TypeScript syntax and writes
   * it to a @islands.ts file that can be verified once the Eleventy build has
   * finished.
   */
  async function emitTypeChecks() {
    // Skip type checking in development but clear the typechecks array anyway.
    if (process.env.NODE_ENV !== "production") return typechecks = [];

    await fs.writeFile(
      path.join(__dirname, "@islands.ts"),
      `import { h } from "preact";\n` +
      `${typechecks.map(({ src, name, props, file }) =>
        `h((await import(".${src}")).${name}, ${JSON.stringify(props)}); // in ${file}`
      ).join("\n")}`,
    );
  }
}
