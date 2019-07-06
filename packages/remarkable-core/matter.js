let fs = require("fs-extra");
let path = require("path");
let matter = require("gray-matter");
let url = require("url");

let pkg = fs.readJSONSync("./package.json");

let paths = {
  pages: path.resolve("./pages"),
};

const DATE_REGEX = /(\d+-\d+-\d+)-/;

function getDateFromPath(relativePath) {
  let matches = relativePath.match(DATE_REGEX);

  if (matches) {
    return matches[1];
  } else {
    return undefined;
  }
}

function getSlugFromPath(relativePath) {
  return relativePath
    // Remove the file name if it's an index file
    .replace(/\/?index\.(html|md)$/, "")
    // Remove the extension
    .replace(/\.(html|md)$/, "")
    // Remove the date
    .replace(DATE_REGEX, "")
    // Remove invalid chars
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/, "-")
}

// Parse front matter and provide sensible defaults when possible
// then return results in the same shape as gray-matter.
function parseFrontMatter(pathToPage, source) {
  let absolutePath = path.resolve(pathToPage);
  let relativePath = path.relative(paths.pages, absolutePath);

  let { data, content } = matter(source);

  data.template = data.template || "default";
  data.slug = data.slug || getSlugFromPath(relativePath);
  data.url = data.url || `/${data.slug}`;
  data.chunks = data.chunks || [];
  data.date = data.date || getDateFromPath(relativePath);
  data.permalink = url.resolve(pkg.site.domain, data.url);
  data.path = relativePath;

  return { data, content };
}

module.exports = { parseFrontMatter };
