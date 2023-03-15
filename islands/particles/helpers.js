export const PI_2 = Math.PI * 2;

/**
 * @param {number} radians
 * @returns {number}
 */
export function normalizeRadians(radians) {
  return (radians % PI_2 + PI_2) % PI_2;
}

/**
 * @param {number} radians
 * @returns {number}
 */
export function radiansToDegrees(radians) {
  return radians / (Math.PI / 180)
}

/**
 * @param {number} degrees
 * @returns {number}
 */
export function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * @param {number} number Number to format
 * @param {number} places Number of decimal places to include
 * @returns {number}
 */
export function roundToFixed(number, places) {
  return Math.round(number * (10 ** places)) / (10 ** places);
}

/**
 * @param {number} radians
 * @returns {string}
 */
export function formatRadians(radians) {
  if (radians === Math.PI) return `Math.PI`;
  if (radians === 2 * Math.PI) return `2 * Math.PI`;
  if (radians === Math.PI / 2) return `Math.PI / 2`;
  return roundToFixed(radians, 3).toString();
}

/**
 * @param {number} value
 * @param {number} step
 */
export function roundToNearest(value, step) {
  return Math.round(value / step) * step;
}
