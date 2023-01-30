let path = require("path");

/**
 * @param {"static" | "hydrate" | "client"} mode
 */
function createIslandShortcode(mode) {
  /**
   * @param {string} entryPoint
   */
  return async (entryPoint) => {
    entryPoint = entryPoint.replace(/^~/, "/dist");

    let islandId = Math.random().toString(16).slice(2, 8);
    let publicDir = path.resolve(__dirname, "../public");
    let entryFile = path.join(publicDir, entryPoint);

    let { h } = await import("preact");
    let { renderToString } = await import("preact-render-to-string");
    let html = "";

    if (mode === "static" || mode === "hydrate") {
      let mod = await import(`${entryFile}?v=${Date.now()}`);
      html = renderToString(h(mod.default));
    }

    let scripts = mode === "hydrate" || mode === "client" ? `
<script type="module">
  import { hydrate, h } from "preact";
  import component from "${entryPoint}";
  hydrate(h(component), document.querySelector('[data-island-id="${islandId}"]'));
</script>
      ` : ``;

    if (mode === "static") {
      return html;
    } else {
      return `<span data-island-id="${islandId}">${html}</span>${scripts}`;
    }
  };
}

/**
 * @param {import("@11ty/eleventy/src/UserConfig")} eleventyConfig
 */
function islandsPlugin(eleventyConfig) {
  eleventyConfig.addShortcode("static-island", createIslandShortcode("static"));
  eleventyConfig.addShortcode("hydrate-island", createIslandShortcode("hydrate"));
  eleventyConfig.addShortcode("client-island", createIslandShortcode("client"));
}

module.exports = islandsPlugin;
