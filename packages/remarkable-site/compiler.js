let remark = require("remark");
let html = require("remark-html");
let shortcodes = require("remark-shortcodes");
let highlight = require("remark-highlight.js");
let slug = require("remark-slug");
let autolink = require("remark-autolink-headings");

let compiler = remark()
  .use(shortcodes)
  .use(highlight)
  .use(slug)
  .use(autolink, {
    behavior: "wrap",
    linkProperties: { class: "anchor" }
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
