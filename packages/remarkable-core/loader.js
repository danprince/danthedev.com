let path = require("path");
let fs = require("fs-extra");
let { template } = require("lodash");
let { compileMarkdown } = require("./compiler");
let { parseFrontMatter } = require("./");

// Keep a cached version of the project's package.json around, so
// that we don't read it every time we run the loader.
let pkg = fs.readJSONSync("./package.json");

// Use liquid inspired templating tags that won't be escaped by the
// markdown parser (the lodash ones are escaped as html).
let templateOptions = {
  interpolate: /{{([\s\S]+?)}}/g,
  evaluate: /{%([\s\S]+?)%}/g,
  escape: /{{-([\s\S]+?)}}/g,
};

async function remarkableSiteLoader(source, loader) {
  // Separate the front-matter from the contents of the file.
  let { data, content } = parseFrontMatter(loader.resourcePath, source);

  // Compile the contents of the file (everything below the front matter)
  // into html.
  let innerHtml = await compileMarkdown(content);

  // Find and read the outer template file
  let outerTemplatePath = path.resolve(`./templates/${data.template}.html`);
  let outerHtml = await fs.readFile(outerTemplatePath, "utf8");

  // Add the template file to the watcher
  loader.addDependency(outerTemplatePath);

  // Compile both templates into functions
  let outerTemplate = template(outerHtml, templateOptions);
  let innerTemplate = template(innerHtml, templateOptions);

  // Finally the loader returns a module that can be called by
  // html-webpack-plugin to return the page's html as a string.
  //
  // This was derived from html-webpack-plugin's own fallback loader.
  // Go back and look at that in future if this gets confusing.
  //
  // Need to require.resolve the libraries so that the ones in our
  // package.json are used (rather than wherever this eventually runs).

  return `
    let site = ${JSON.stringify(pkg.site)};
    let page = ${JSON.stringify(data)};
    let datefns = require("${require.resolve("date-fns")}");
    let striptags = require("${require.resolve("striptags")}");
    let _ = require("${require.resolve("lodash")}");

    module.exports = () => {
      let content = ${innerTemplate}(_);
      return ${outerTemplate}(_);
    };
  `;
}

// Tiny wrapper around the loader so that it can be written as a
// standard async function without worrying about the weird
// callback or implicit this.
async function loader(source) {
  let callback = this.async();

  try {
    let output = await remarkableSiteLoader(source, this);
    callback(null, output);
  } catch (err) {
    callback(err);
  }
}

module.exports = loader;
