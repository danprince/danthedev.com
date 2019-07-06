let format = require("date-fns/format");
let { parseFrontMatter } = require("@danprince/remarkable-core/matter");

module.exports = function linkLoader(source) {
  let { data } = parseFrontMatter(this.resourcePath, source);

  let date = new Date(data.date);
  let formattedDate = format(date, "MMM D");
  let time = `<time datetime="${date}">${formattedDate}</time>`;
  let title = `<span class="title">${data.title}</span>`;
  let link = `<span class="page-link">${time} - <a href="${data.url}">${title}</a></span>`;

  return `module.exports = \`${link}\``;
}
