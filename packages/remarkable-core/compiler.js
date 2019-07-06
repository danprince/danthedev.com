let remark = require("remark");
let html = require("remark-html");
let shortcodes = require("remark-shortcodes");
let prism = require("@gridsome/remark-prismjs");
let slug = require("remark-slug");
let plugins = require("@danprince/remarkable-plugins");
let autolink = require("remark-autolink-headings");

let compiler = remark()
  .use(shortcodes)
  .use(plugins.shortcodes)
  .use(prism)
  .use(slug)
  .use(autolink, {
    behavior: "wrap",
    linkProperties: { class: "heading-anchor" }
  })
  .use(html);

function compileMarkdownSync(source) {
  return compiler.processSync(source).toString();
}

async function compileMarkdown(source) {
  let file = await compiler.process(source);
  return file.toString();
}

module.exports = { compileMarkdownSync, compileMarkdown };
