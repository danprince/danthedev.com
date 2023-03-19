/**
 * Loading and rendering islands in a worker thread means that they always
 * have a fresh set of dependencies and we don't need to mess around with
 * cache busting.
 */

let { Worker, isMainThread, parentPort } = require("worker_threads");
let assert = require("assert");

/**
 * @type {Worker}
 */
let worker;
let requests = {};
let requestId = 0;

/**
 * @typedef {object} request
 * @property {string} request.file The file to import the island from
 * @property {string} request.name The name of the export to use
 * @property {Record<string, any>} request.props The props to render it with
 */

/**
 * @param {RenderRequest} request
 */
function renderToStringWithWorker(request) {
  return new Promise((resolve, reject) => {
    let id = requestId++;
    requests[id] = { resolve, reject };
    worker.postMessage({ id, request });
  });
}

/**
 * @param {RenderRequest} request
 * @returns {Promise<string>}
 */
async function loadAndRenderToString({ file, name, props }) {
  // Need to use ESM for these preact imports so that this module gets the
  // same instance of preact as the component we're rendering (a commonjs
  // version gets us a different one).
  let { h } = await import("preact");
  let { renderToString } = await import("preact-render-to-string");
  let module = await import(file);
  let component = module[name];

  // This gets us a much better error message than if we pass `undefined` into
  // Preact's `h` function.
  assert(
    typeof component === "function",
    `Island "${name}" from "${file}" is not a valid component!`,
  );

  return renderToString(h(component, props));
}

function closeWorker() {
  worker?.terminate();
}

function resetWorker() {
  closeWorker();

  worker = new Worker(__filename);

  worker.on("message", ({ id, result, error }) => {
    if (error) requests[id].reject(error);
    else requests[id].resolve(result);
    delete requests[id];
  });
}

if (isMainThread) {
  resetWorker();
} else {
  parentPort.on("message", async ({ id, request }) => {
    try {
      let result = await loadAndRenderToString(request);
      parentPort.postMessage({ id, result });
    } catch (error) {
      parentPort.postMessage({ id, error });
    }
  });
}

module.exports = { closeWorker, resetWorker, renderToStringWithWorker };
