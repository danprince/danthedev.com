let path = require("path");
let esbuild = require("esbuild");
let syntax = require("@11ty/eleventy-plugin-syntaxhighlight");
let markdown = require("markdown-it");
let linkAttrs = require("markdown-it-link-attributes");
let toc = require("markdown-it-table-of-contents");
let attrs = require("markdown-it-attrs");
let anchor = require("markdown-it-anchor");

/**
 * @param {string[]} entryPoints
 * @returns {Promise<string>}
 */
async function esbuildShortcode(entryPoint) {
  let directory = path.dirname(this.page.inputPath);
  entryPoint = path.join(directory, entryPoint);

  let result = await esbuild.build({
    entryPoints: [entryPoint],
    entryNames: `[hash]`,
    minify: true,
    sourcemap: true,
    metafile: true,
    bundle: true,
    outdir: path.resolve("_site/assets"),
    jsxImportSource: "preact",
  });

  if (result.errors.length) {
    for (let err of result.errors) {
      console.error(err);
    }

    throw new Error("esbuild bundle error");
  }

  let tags = Object.keys(result.metafile.outputs).map(key => {
    let src = key.replace(/^_site/, "");
    if (/\.js$/.test(src)) return `<script src="${src}"></script>`;
    if (/\.css$/.test(src)) return `<link rel="stylesheet" href="${src}" />`;
    return "";
  });

  return tags.join("\n");
}

/**
 * @param {import("@11ty/eleventy/src/UserConfig")} config
 */
module.exports = config => {
  config.addPlugin(syntax);

  config.addPassthroughCopy({ "public": "/" })

  // These files will be copied through in-place
  config.setTemplateFormats(["md", "css"]);

  config.addShortcode("esbuild", esbuildShortcode);

  config.addWatchTarget("**/*.ts");
  config.addWatchTarget("**/*.tsx");

  let md = markdown({
    html: true,
    linkify: true,
    breaks: true,
  });

  md.use(anchor, {
    permalink: anchor.permalink.linkInsideHeader({
      symbol: "#",
      class: "permalink",
      placement: "before",
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

function slugify(str) {
  return str
    .replace(/ & /g, " and ")
    .replace(/[']/g, "")
    .replace(/[^\w]+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}
