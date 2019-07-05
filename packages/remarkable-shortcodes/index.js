let map = require("unist-util-map");
let u = require("unist-builder");

module.exports = () => tree => {
  return map(tree, node => {
    // Not using any shortcodes at the moment
    return node;
  });
};
