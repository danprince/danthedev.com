let path = require("path");
let HtmlPlugin = require("html-webpack-plugin");
let vfile = require("to-vfile");
let { parseFrontMatter } = require("./matter");

let loader = require.resolve("./loader");

// Convenience wrapper around html-webpack-plugin
function createHtmlPlugin(pathToPage) {
  let file = vfile.readSync(pathToPage);
  let markdown = file.toString();
  let { data } = parseFrontMatter(pathToPage, markdown);

  console.log(`creating: ${data.path} -> ${data.url}`);

  return new HtmlPlugin({
    filename: path.join("./", data.url, "index.html"),
    chunks: data.chunks,
    template: `!!${loader}!${file.path}`,
    inject: true,
    cache: false,
  });
}

module.exports = { createHtmlPlugin, parseFrontMatter };
