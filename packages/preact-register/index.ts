import * as Preact from "preact";

// Renders a Preact component to all the dom nodes that have a
// [data-component=YourComponentName] selector. Simpler version
// of preact-habitat.
//
// TODO: Support shared contexts by rendering through portals?
// preact-portal doesnt work, but might be worth looking at createPortal
// from preact/compat.

function safeParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch (err) {
    return str;
  }
}

export function render(component: any) {
  let elements = document.querySelectorAll(`[data-component="${component.name}"]`);

  for (let element of elements) {
    let props = {};

    for (let attr of element.attributes) {
      let match = attr.name.match(/data-prop-(\w+)/);

      if (match) {
        let name = match[1];
        props[name] = safeParseJson(attr.value);
      }
    }

    let vnode = Preact.h(component, props);

    Preact.render(vnode, element);
  }
}
