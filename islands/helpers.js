export const isBrowser = typeof document !== "undefined";

/**
 * Linear scale inspired by D3.
 * @param {object} params
 * @param {[from: number, to: number]} params.range
 * @param {[from: number, to: number]} params.domain
 * @returns {(value: number) => number}
 */
export function linearScale({ range, domain }) {
  return (value) => {
    let normalised = (value - domain[0]) / (domain[1] - domain[0]);
    return range[0] + normalised * (range[1] - range[0]);
  }
}

/**
 * @param {number[]} values
 * @returns {[min: number, max: number]}
 */
export function extent(values) {
  let min = values[0] || 0;
  let max = values[0] || 0;
  for (let value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return [min, max];
}


/**
 * @param {HTMLElement} element
 * @param {*} param1 
 * @returns 
 */
export function onVisibilityChange(element, { onVisible, onHidden }) {
  let wasIntersecting = false;

  let observer = new IntersectionObserver(
    ([ entry ]) => {
      if (!wasIntersecting && entry.isIntersecting) {
        onVisible();
      }
      if (wasIntersecting && !entry.isIntersecting) {
        onHidden();
      }
      wasIntersecting = entry.isIntersecting
    }
  );
  observer.observe(element);

  return () => observer.disconnect();
}
