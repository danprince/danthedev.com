let path = require("path");
let HtmlPlugin = require("html-webpack-plugin");
let vfile = require("to-vfile");
let matter = require("gray-matter");
let loader = require.resolve("./loader");

// Convenience wrapper around html-webpack-plugin
function createHtmlPlugin(pathToPage) {
  let file = vfile.readSync(pathToPage);
  let markdown = file.toString();
  let { data } = matter(markdown);
  let { url="", chunks=[] } = data;

  return new HtmlPlugin({
    filename: path.join("./", url, "index.html"),
    chunks: chunks,
    template: `!!${loader}!${file.path}`,
    inject: true,
    cache: false,
  });
}

module.exports = { createHtmlPlugin };
