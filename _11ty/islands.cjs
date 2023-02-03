let path = require("path");
let crypto = require("crypto");

/**
 * @param {any[]} array
 * @return {Record<string, any>}
 */
function propsToObject(array) {
  /**
   * @type {Record<string, any>}
   */
  let props = {};

  for (let i = 0; i < array.length; i += 2) {
    let key = array[i];
    let val = array[i + 1];
    props[key] = val;
  }

  return props;
}

let uid = 0;

/**
 * @param {"static" | "hydrate" | "client"} mode
 */
function createIslandShortcode(mode) {
  /**
   * @param {string} entryPoint
   * @param {any[]} propArgs
   */
  return async (entryPoint, ...propArgs) => {
    let islandId = crypto
      .createHash("sha1")
      .update(`${uid++}`)
      .digest("hex")
      .slice(0, 6);

    let publicDir = path.resolve(__dirname, "../_site/");
    let entryFile = path.join(publicDir, entryPoint);

    let { h } = await import("preact");
    let { renderToString } = await import("preact-render-to-string");

    let html = "";
    let props = propsToObject(propArgs);

    // Use a `?v=` parameter to cache-bust any previous times we've imported
    // this module.
    let mod = await import(`${entryFile}?v=${Date.now()}`);

    if (mode === "static" || mode === "hydrate") {
      html = renderToString(h(mod.default, props));
    }

    let scripts = `
<script type="module" async>
  new IntersectionObserver(async ([entry], observer) => {
    if (entry.intersectionRatio <= 0) return;
    ${mode === "client" ? "let { h, render }" : "let { h, hydrate: render }"} = await import("preact");
    let component = await import("${entryPoint}");
    render(h(component.default, ${JSON.stringify(props)}), entry.target);
    observer.disconnect();
  }).observe(document.querySelector('[data-island-id="${islandId}"]'));
</script>
      `.trim();

    if (mode === "static") {
      return html;
    } else {
      return `<preact-island data-island-id="${islandId}">${html}</preact-island>
${scripts}`;
    }
  };
}

/**
 * @param {any} eleventyConfig
 */
function islandsPlugin(eleventyConfig) {
  eleventyConfig.addShortcode("island", createIslandShortcode("hydrate"));
  eleventyConfig.addShortcode("static-island", createIslandShortcode("static"));
  eleventyConfig.addShortcode("client-island", createIslandShortcode("client"));
}

module.exports = islandsPlugin;
