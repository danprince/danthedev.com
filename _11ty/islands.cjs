let path = require("path");

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

/**
 * @param {"static" | "hydrate" | "client"} mode
 */
function createIslandShortcode(mode) {
  /**
   * @param {string} entryPoint
   * @param {any[]} propArgs
   */
  return async (entryPoint, ...propArgs) => {
    let islandId = Math.random().toString(16).slice(2, 8);
    let publicDir = path.resolve(__dirname, "../.cache");
    let entryFile = path.join(publicDir, entryPoint);

    let { h } = await import("preact");
    let { renderToString } = await import("preact-render-to-string");

    let html = "";
    let props = propsToObject(propArgs);

    // Use a `?v=` parameter to cache-bust any previous times we've imported
    // this module.
    let mod = await import(`${entryFile}?v=${Date.now()}`);

    if (mod.getStaticProps) {
      let staticProps = await mod.getStaticProps();
      Object.assign(props, staticProps);
    }

    if (mode === "static" || mode === "hydrate") {
      globalThis.__dirname = path.join(__dirname, "../src/");
      html = renderToString(h(mod.default, props));
    }

    let scripts = `
<script type="module" async>
  ${mode === "client"
    ? `import { render, h } from "preact";`
    : `import { hydrate as render, h } from "preact";`}
  import component from "${entryPoint}";
  render(
    h(component, ${JSON.stringify(props)}),
    document.querySelector('[data-island-id="${islandId}"]')
  );
</script>
      `.trim();

    if (mode === "static") {
      return html;
    } else {
      return `<eleventy-island data-island-id="${islandId}">${html}</eleventy-island>
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
