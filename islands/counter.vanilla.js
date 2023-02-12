/**
 * @type {Vanilla<{ value?: number }>}
 */
export default {
  render({ value = 0 }) {
    return `<button>${value}</button>`;
  },
  hydrate({ value = 0 }, element) {
    const button = element.querySelector("button");
    if (button) {
      button.onclick = () => button.textContent = `${value++}`;
    }
  }
}
