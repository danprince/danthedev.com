---
title: Why Are You Still Here, Mr Module?
---

No one writes the full program correctly on their first go. Programming, debugging, and testing are all incremental processes. We add a line of code, we comment something out, we change the condition in a branch, then we want to see the effects of those changes.

There are three common scenarios for what happens after you edit some code on disk.

1. You have to manually restart a running process.
2. A watcher automatically restarts a running process.
3. Your changes are automatically reloaded into a running process ([hot reloading](https://en.wikipedia.org/wiki/Hot_swapping)).

Remembering to do manual restarts is a pain. Having a watcher handle them for you works well, if the process can start up again quickly. The third option is the fastest, but it's also the trickiest to implement.

In JavaScript, the most common reloadable unit is a module: a single file on a disk or a network. A program is a graph of dependent modules, where each import is a directed connection between two modules. A full process restart involves unloading the entire graph and rebuilding it from scratch. A partial reload involves unloading and reloading a subset of that graph, often a single changed module. O(n) vs O(1).

There are costs to pay each time we load a module. A cost for reading from a disk or a network. A cost for parsing the code, and a cost for evaluating it. The nature of the module graph means the runtime must do the reading and parsing steps before it can move onto the next degree of dependent modules.

When your project has only a few modules, the performance difference between a full reload and a partial reload will be negligible. For thousands of modules, the difference will be significant.

Let's look at what makes it tricky to do these partial reloads.

## CommonJS

Here's a JavaScript file, written to run on Node.

```js
// calls.js
let calls = 0;

function call() {
  return calls += 1;
}

module.exports = { call };
```

Each time something invokes `call`, the function modifies the state of the module. `calls` isn't a global variable. Now let's say we require this module multiple times.

```js
let a = require("./calls");
assert(a.call() === 1);

let b = require("./calls");
assert(a.call() === 2);
assert(a === b);
```

We called `require` twice, but `a` and `b` are the same value! Node only loads the module once, then it goes into a cache. If we `require` the module again, Node uses the cached version.

If each call to `require` instantiated a new module, then our programs would be full of stale references. These can lead to [bugs](https://guides.rubyonrails.org/autoloading_and_reloading_constants.html#reloading-and-stale-objects) that are incredibly difficult to reproduce, that may only occur after a certain set of modules are swapped out in a certain order.

Node isn't going to reload modules for us automatically, but because `require` and `module` _are_ provided by Node, it _can_ expose the implementation details we need to do that cache invalidation ourselves. 

The first time we `require` a module, Node instantiates it then adds to `require.cache` on disk, storing it under a key which is its absolute file path on disk.

`require.cache` is a regular JavaScript object. We can `console.log` it, we can add new keys, and we can _delete_ existing ones.

```js
let a = require("./calls");
assert(a.call() === 1);

delete require.cache[require.resolve("./calls")];

let b = require("./calls");
assert(b.call() === 1);
```

`a` and `b` are no longer the same object! They are separate module instances with independent module state and scope. We reloaded the module from disk without restarting the process!

This kind of reloading works best for modules that have a single well defined callsite. Or if you want to be fancy, the higher the indegree of the module, the harder it will be to swap it out.

For the sake of the curious, here are some hot-reloading and/or module cache clearing implementations for various Node frameworks.

- [Next.js](https://github.com/vercel/next.js/blob/20b8dda0e8804f3c488b569c3355647ed5da9ac8/packages/next/src/build/webpack/plugins/nextjs-require-cache-hot-reloader.ts#L19-L43)
- [Remix](https://github.com/remix-run/remix/blob/db60b2e25a3e7f0ae88770de7da186781df073aa/packages/remix-dev/devServer/serve.ts#L10-L16)
- [Nuxt](https://github.com/nuxt/nuxt/blob/9e67e57efd08efddfd2852c06b571a55ebd0f9d6/packages/kit/src/internal/cjs.ts#L32-L53)
- [Gatsby](https://github.com/gatsbyjs/gatsby/blob/9f26b6722955463492776965182baabe779216f8/packages/gatsby/src/utils/clear-require-cache.ts#L1-L25)

And everyone used `require.cache` to reload modules at runtime, everything was fast, and they all lived happily ever after.

Wait. What's that sound? That's the sound of ES modules arriving in Node and not giving a damn about `require.cache` or everyone's happily ever after.

## ES Modules

The last few versions of Node have had support for ES modules, JavaScript's own module format. This is a language level alternative to `require` and `module` ([CommonJS](https://nodejs.org/api/modules.html), Node's own module system). This throws a big spanner into the works for invalidating cached modules.

Let's convert the example from earlier from CommonJS into an ES module.

```js
// calls.mjs
let calls = 0;

export function call() {
  return calls += 1;
}
```

Not a huge difference, but something very important has changed here. Node is no longer responsible for managing modules. That has moved to the language level, and to the JavaScript engine.

Let's repeat the test from earlier to see what has changed.

```js
import * as a from "./calls";
assert(a.call() === 1);

import * as b from "./calls";
assert(a.call() === 2);
assert(a === b);
```

The imports are still cached. The engine instantiates a single module and successive imports will return it. But now that cache is opaque and it lives within V8, not Node.

If `calls.mjs` changes on disk, we have no way to tell the engine to invalidate any cached versions of it. Deleting keys from `require.cache` will have no impact here, because V8 knows nothing, and cares nothing for `require.cache`.

### Cache Busting

A commonly suggested workaround is to use dynamic imports with a cache busting query parameter.

```js
let a = await import(`./calls?v=${Math.random()}`);
assert(a.call() === 1);

let b = await import(`./calls?v=${Math.random()}`);
assert(a.call() === 1);
assert(a !== b);
```

This was the approach I used in my recent post on ["Interactive Islands"](https://danthedev.com/interactive-islands/#cached-imports).

It works pretty well when you only test it with a simple module graph. Whenever you want a fresh version of a module, just import it through a unique URL. Maybe that's a date, maybe that's a counter, maybe it's a random number.

This means that the cache is growing indefinitely and we're leaking memory. We can load fresh modules, but we can't remove stale ones from the cache. The garbage collector can't kick in, even if we clean up all stale references from our own code.

The bigger problem is with transitive imports. What happens when we use a cache busting import to import a module that imports another module, without a cache busting import?

Let's say `a.mjs` imports `b.mjs` using a cache busting parameter, and `b.mjs` imports `c.mjs` normally. `a.mjs` can always get a fresh version of `b.mjs`, but `b.mjs` will always get the cached version of `c.mjs`, even if `c.mjs` has changed on disk. `b.mjs` would also need to use a cache busting import, and so on until cache busting imports have spread contagiously throughout your module graph.

### Worker Threads

Thankfully, there is another, less common workaround, which is to move the work away from the main thread, to a [worker thread](https://nodejs.org/api/worker_threads.html).

When you create a worker, it gets a new engine context with an empty module cache. It will import fresh versions of modules that were already imported on the main thread. This solves the problem of stale transitive imports.

The downside is that a worker does not share memory with the main thread. It can't pass a reference to a module back to the main thread. It can only communicate using [transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects) and values that are compatible with the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

That means that the worker isn't just responsible for importing a new module, but it also has to know what to do with it, to produce a value it can send back to the main thread. This architectural constraint means that workers won't work in some reloading scenarios.

Let's look at some code!

```js
// worker.mjs
import { Worker, isMainThread, workerData, parentPort } from "worker_threads";
import { fileURLToPath } from "url";

export function callWithWorker(modulePath) {
  let file = fileURLToPath(import.meta.url);
  let worker = new Worker(file, { workerData: { modulePath } });
  return new Promise((resolve, reject) => {
    worker.once("error", reject);
    worker.once("message", resolve);
  });
}

if (!isMainThread) {
  import(workerData.modulePath).then(module => {
    let result = module.call();
    parentPort.postMessage(result);
  });
}
```

This `worker.mjs` file has an interesting trick up it's sleeve. On the main thread, it exports a function which creates and communicates with a worker instance, giving its own filename and a `modulePath` parameter.

The worker starts this file up again in another thread, but this time `isMainThread` is false, and we fall into a worker-only branch. This branch imports whichever module path we passed from the main thread, then calls its `call` export, and passes the result back.

The main thread is listening for `error` and `message` events from the worker, and uses them to resolve the promise that `callWithWorker` returned.

Here's how this looks in practice.

```js
import { callWithWorker } from "./worker.mjs";

assert(await callWithWorker("./calls.mjs") === 1);
assert(await callWithWorker("./calls.mjs") === 1);
assert(await callWithWorker("./calls.mjs") === 1);
```

Each call to `callWithWorker` creates an isolated context and a fresh version of our `calls.mjs` module. A reliable way to invalidate a whole subgraph of ES modules. And there was much rejoicing!

### Shared Workers

My use case for module cache invalidation is to pick up changes to ["islands"](/interactive-islands) between builds, without restarting the [Eleventy](11ty.dev) process.

Using CommonJS isn't an option, because I re-use the exact same files to load the islands in browsers, and I don't have a build step that would transform the syntax.

Initially, [I tried with cache busting imports](/interactive-islands/#cached-imports), and I didn't notice any problems until last week, when I started work on a bigger post. When I split the islands into multiple files, I discovered that only the entrypoint reloaded correctly, and the transitive imports stayed stale.

After some confusing debugging I learned about the worker approach and was able to fix the stale imports. But it bothered me that I had to create a new worker for every single import.

A change on disk to any of the island files triggers an Eleventy rebuild, and during that rebuild there's no reason to instantiate those modules multiple times. They aren't going to change in that window. Ideally, I would clear the cache once per build.

I adapted the workers idea to use a shared worker across requests. Instead of running then immediately exiting, this worker thread stays alive listening for subsequent messages.

We have to twiddle the code around a bit to make that work, but the building blocks are largely the same.

```js
// shared-worker.mjs
import { Worker, isMainThread, parentPort } from "worker_threads";
import { fileURLToPath } from "url";

let worker;
let requests = {};
let requestId = 0;

if (isMainThread) {
  let file = fileURLToPath(import.meta.url);
  worker = new Worker(file);

  worker.on("message", ({ id, result, error }) => {
    if (error) requests[id].reject(error);
    else requests[id].resolve(result);
    delete requests[id];
  });
} else {
  parentPort.on("message", async ({ id, modulePath }) => {
    try {
      let module = await import(modulePath);
      let result = module.call();
      parentPort.postMessage({ id, result });
    } catch (error) {
      parentPort.postMessage({ id, error });
    }
  });
}

export function callWithSharedWorker(modulePath) {
  return new Promise((resolve, reject) => {
    let id = requestId++;
    requests[id] = { resolve, reject };
    worker.postMessage({ id, modulePath });
  });
}
```

In the main thread we create a shared worker instance for all calls to `callWithSharedWorker`. Without a dedicated worker per request, we have to make sure our messages don't get tangled up.

Each time something calls `callWithSharedWorker` we increment a module level `requestId` which we send to the worker, and we expect back from the worker so that we know which request the current response or error is for.

The worker side is similar, but now we can't let an error crash the whole worker, instead, errors need to be caught and sent back as part of a specific response.

But doesn't this take us straight back to square one? Successive calls to `callWithSharedWorker` will use the cached modules.

```js
import { callWithSharedWorker } from "./shared-worker";

assert(await callWithSharedWorker("./calls.mjs") === 1);
assert(await callWithSharedWorker("./calls.mjs") === 2);
assert(await callWithSharedWorker("./calls.mjs") === 3);
```

The difference is that we control the worker. We can implement a function like `resetSharedWorker` which replaces it.

```js
export function resetSharedWorker() {
  worker.terminate();
  worker = new Worker(__filename);
  worker.on("message", ...);
}
```

Terminating the old worker cleans it up. This step is necessary otherwise the workers will continue running, listening for messages, even if they've gone out of scope in the main thread.

There's a caveat here. It might not be safe to terminate the old worker immediately if you have requests that are still in-flight. A more robust solution would be to give each worker a separate request map, then swap the workers over and only terminate the old worker when that map was empty.

Finally we swap the old worker for a new one, and recreate the necessary listeners. Now we have granular control over when we do and don't want to load fresh modules.

```js
import { callWithSharedWorker, resetSharedWorker } from "./shared-worker";

assert(await callWithSharedWorker("./calls.mjs") === 1);
assert(await callWithSharedWorker("./calls.mjs") === 2);
assert(await callWithSharedWorker("./calls.mjs") === 3);
resetSharedWorker();
assert(await callWithSharedWorker("./calls.mjs") === 1);
assert(await callWithSharedWorker("./calls.mjs") === 2);
assert(await callWithSharedWorker("./calls.mjs") === 3);
```

For my use case, this is perfect. I call `resetSharedWorker` once per build. That prevents Node from doing any redundant module instantiation.

In a long running process, this is fine, but if you want your Node process to exit, as for a test suite like the one above, you'll need to terminate the worker after you've finished using it.

I use a `closeSharedWorker` function that calls `worker.terminate()`.

This implementation isn't particularly generic. It imports a module and calls an export called `call`[^naming-things]. In my blog's codebase, this worker does specific things to render a component to a string of HTML. However, we can make these workers more generic if needs be.

In the same way that we pass the path to the module we want to import, 

We can parameterise the name of the export we'll call, and the arguments we'll pass along to it.

```js
// ...

export function callWithSharedWorker(modulePath, exportName, args) {
  return new Promise((resolve, reject) => {
    let id = requestId++;
    requests[id] = { resolve, reject };
    worker.postMessage({ id, modulePath, exportName, args });
  });
}

if (!isMainThread) {
  parentPort.on("message", async ({ id, modulePath, exportName, args }) => {
    try {
      let module = await import(modulePath);
      let result = await module[exportName](...args);
      parentPort.postMessage({ id, result });
    } catch (error) {
      parentPort.postMessage({ id, error });
    }
  });
}
```

Now we can recreate the original behaviour.

```js
// Read as:
// - Load "calls.mjs" in the worker
// - Call its "call" export with no arguments
assert(await callWithSharedWorker("./calls.mjs", "call", []) === 1);
```

## Conclusion
There are still a lot of projects that sidestep this problem by compiling ES modules into CommonJS before running it on Node, then using `require.cache` for all their cache invalidation needs.

The JavaScript ecosystem has already got a big problem with overcomplicated tooling and build steps. Throwing tools at these kinds of problems is a short term solution. It's rare that we actually just write code that's ready to run!

You can find implementations and tests for the various module cache invalidation strategies at [danprince/node-code-reload](https://github.com/danprince/node-code-reload) on GitHub. You can also find the implementation I use for this blog at [danprince/danthedev.com](https://github.com/danprince/danthedev.com).

[^naming-things]: Calls, called, `call`. After writing a whole post about cache invalidation, it seems fitting to also struggle with naming things.
