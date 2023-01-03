let path = require("path");
let esbuild = require("esbuild");
let syntax = require("@11ty/eleventy-plugin-syntaxhighlight");
let image = require("@11ty/eleventy-img");
let markdown = require("markdown-it");
let linkAttrs = require("markdown-it-link-attributes");
let attrs = require("markdown-it-attrs");
let anchor = require("markdown-it-anchor");
const { join } = require("path");

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
  });

  let output = Object.keys(result.metafile.outputs).find(key => {
    let output = result.metafile.outputs[key];
    return output.entryPoint === entryPoint;
  });

  output = output.replace(/^_site/, "");
  return `<script src="${output}"></script>`;
}

async function imageShortcode(src, alt) {
  // Ensure src is relative
  src = join(__dirname, src);

  const width = 700;

  let metadata = await image(src, {
    widths: [width, width * 2],
    outputDir: join(__dirname, "_site/img"),
  });

  return image.generateHTML(metadata, {
    alt,
    sizes: "100%",
    loading: "lazy",
    decode: "async",
  });
}

module.exports = config => {
  config.addPlugin(syntax);

  config.addPassthroughCopy({ "public": "/" })

  // These files will be copied through in-place
  config.setTemplateFormats(["md", "css"]);

  config.addShortcode("esbuild", esbuildShortcode);
  config.addShortcode("image", imageShortcode);

  config.addWatchTarget("**/*.ts");

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
