let map = require("unist-util-map");
let u = require("unist-builder");

exports.shortcodes = () => tree => {
  return map(tree, node => {
    if (node.type !== "shortcode") {
      return node;
    }

    switch (node.identifier) {
      case "link": {
        let { to } = node.attributes;
        return u("text", { value: `{{ require("!!link-loader!${to}") }}` });
      }

      default:
        return node;
    }
  });
};
