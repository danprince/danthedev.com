---
title: Interactive Islands
layout: post.html
---

<aside>

⚠️ <strong>Outdated!</strong> I removed the islands functionality last time I reworked this site because I didn't actually end up using them much. I'm keeping the post around for posterity, but don't expect the examples to work!

</aside>

My most recent adventure into how well the browser works, involved building a minimalist implementation of the [islands architecture](https://jasonformat.com/islands-architecture/) for this site.

An island is an interactive section within a sea of static content. The term is _usually_ associated with server-side rendering and some people call it "partial hydration". In the islands metaphor, hydration is a particularly confusing term, as by definition, the island is the dry bit. Names are hard.

I started pulling this thread about 7 months ago, when I wrote [eleventy-preact-islands](https://github.com/danprince/eleventy-preact-islands). That was after spending a week experimenting with [Astro](https://astro.build/) right after it launched. Then I decided to write a [new static site generator](https://github.com/danprince/melange-experimental). Then I [rewrote it](https://github.com/danprince/sietch). Then I [rewrote the rewrite](https://github.com/danprince/sietch/issues/11). And now I find myself back at [Eleventy](https://www.11ty.dev/) with an implementation for islands in less than 100 lines of code.

<button>0</button>

👆 See that unassuming button there? That's an island. If you reload this page with JavaScript disabled you'll see the same button, because it was rendered at build time. You already clicked it didn't you? That was very irresponsible. There's no point trying to create suspense now!

This island lives with a script tag which uses [Preact](https://preactjs.com) to hydrate the HTML it rendered at build time, creating the interactive (and overly dramatic) counter above. A button this simple is _not_ a good reason to bring a component framework into a page, it just happens to be a simple island that's easy to test.

A more focused programmer might have just added a script tag that defines a web component, then started using it immediately to add interactive examples to posts. Build time rendering be damned! I aspire to that level of ruthless pragmatism, but alas, tinkering tickles my brain too much. I _want_ to enjoy using web components, but that's a rant for another day!

I build this site with a tool called [Eleventy](https://www.11ty.dev/). Compared to some other static site generators, Eleventy takes a completely hands off approach when it comes to runtime. There are no bundlers, minifiers, or component frameworks in sight. The frontend web is plagued with shocking amounts of incidental complexity (mostly JavaScript) and I think Eleventy's lack of opinions creates a useful barrier. It forces authors to think before they embed [thousands of lines of someone else's code](http://localhost:8080/javascripts-dependency-problem/) into the sites they build.

If Eleventy isn't going to help (or hinder) me when it comes to building the client side of these interactive experiences, then why not use a tool that will? Like [Astro](https://astro.build/)? If you want to build islands with a great developer experience out of the box, then you should use Astro. I rewrote this site with Astro as an experiment and I enjoyed it! But I couldn't shake a nagging feeling that it could all be a bit simpler.

I got hit with a few Go panics early on. I don't mind rough edges right after a launch, but seeing the blend of languages leaking out of the tooling set off my overengineering alarm bells. Go was just used for the compiler that turns `.astro` files into TypeScript. It's technically very impressive when you install the VSCode extension and see TypeScript language support in these `.astro` files but, well, couldn't we have gotten that by just writing these components in TypeScript to start with? Did we need a new language, with a new compiler, and new editor extensions? Maybe we did. Maybe complexity in software has just worn me down.

Anyway, I did what any programmer with too much free time on their hands does. I built my own static site generator. A post-mortem for [Sietch](https://sietch.netlify.app/) is probably worth its own blog post one day, but the headline features were: simplicity bordering on nihilism and a way to build islands with TypeScript and Preact without node or npm in sight. I built it all with Go, just in case anyone was thinking I had some language based bias against Astro back there.

Back in Eleventy land, two projects caught my attention. The first was [Slinkity](https://slinkity.dev/), a glue between Vite and Eleventy for islands and post-processing stuff. The other was [is-land](https://github.com/11ty/is-land), an islands implementation from the Eleventy team. They're both great projects, and just like Astro, they inspired the approach I ended up taking.

In this site, an island is just a Preact component. Specifically, it's the default export of a file that lives inside the `islands` directory.

```js
// islands/counter.js
import { h } from "preact";
import { useState } from "preact/hooks";

export default ({ value = 0 }) => {
  let [count, setCount] = useState(value);
  let increment = () => setCount(count + 1);
  return h("button", { onClick: increment }, count);
};
```

## Shortcodes

When I want to add an interactive island into a post, I need some way to tell the build process to import the island and render it to HTML.

Is-land uses a markdown plugin which searches for `<is-land>` tags. Slinkity uses [shortcodes](https://www.11ty.dev/docs/shortcodes/). The shortcode implementation is a little bit simpler overall, so that's how I went about it.

Here's how a shortcode looks in a page.

```liquid
{{'{% island "/islands/counter.js" %}'}}
```

Behind the scenes is a JavaScript function in the Eleventy config which receives the positional arguments we passed and returns a string of content to render.

```js
// eleventy.config.js
eleventyConfig.addShortcode("island", (src) => `TODO`);
```

This function has two main responsibilities.

- Import the component at build time and render it to a static string of HTML.
- Generate the appropriate script tags and imports to hydrate the component at runtime.

## Rendering

Let's start with build time rendering.

```js
// eleventy.config.cjs
eleventyConfig.addShortcode("island", async (src, ...args) => {
  let { h } = await import("preact");
  let { renderToString } = await import("preact-render-to-string");

  let file = path.join(__dirname, src);
  let mod = await import(file);
  let props = argsToProps(args);

  return renderToString(h(mod.default, props));
});
```

There's a tricky problem with Preact. The Eleventy config needs to be a CommonJS. However, if we `require` Preact, we get [a different version of the library](https://github.com/preactjs/preact/blob/dec4d42aeb16e8ee12a3196b7cfae18f6af0c1fd/package.json#L7-L8) from the one our islands get when they `import` it. As soon as you use hooks (with all their wonderful implicit hooky magic) you'll see an error like this.

- `Cannot read properties of undefined (reading '__H') (via TypeError)`

Translation:

- `You tried calling a hook from a component where hooks aren't installed.`
- `You probably have two copies of Preact active.`

Preact already goes above and beyond to optimise the library's size, so I can forgive some occasional esoterica. The workaround here is to pull Preact down into the nearest `async` scope and to use dynamic imports.

I try and stay close to Eleventy's defaults, and that means I'm using liquid as the templating language. Liquid doesn't support shortcodes with named arguments which means we have to be a little bit creative to pass props to components.

```liquid
{{'{% island "/islands/counter.js" "count" 10 %}'}}
```

This involves treating extra arguments as pairs of keys and values. Yes, it bothers me that there's no type safety here, but not enough to want to write my posts as markdown inside TypeScript files instead.

<aside>

💡 Although now it occurs to me that I could convert each of these calls into TypeScript syntax at build time, write them all out to a dummy file, then have the compiler check it as a post-build step? [PR time!](https://github.com/danprince/danthedev.com/pull/33)

</aside>

This is cool and all, but the whole point of these islands is that they _aren't_ static content. We still need to bring them to life on the other side.

## Hydration

To make the island interactive again in the browser, we need to import it and pass it to Preact's `hydrate` function.

```js
// .eleventy.cjs
eleventyConfig.addShortcode("island", async (src, ...args) => {
  // ...

  let html = renderToString(h(mod.default, props));
  let id = Math.random().toString(16).slice(2, 8);

  return `
<div data-island-id="${id}">${html}</div>
<script async type="module">
  import { h, hydrate } from "preact";
  import component from "${src}";
  let element = document.querySelector(\`[data-island-id="${id}"]\`);
  hydrate(h(component, ${JSON.stringify(props)}), element);
</script>`;
});
```

We're wrapping the `html` inside a `<div>` tag, which gives us a mount point to hydrate from. Using a tag that [markdownit](https://github.com/markdown-it/markdown-it) recognises as a [block tag](https://github.com/markdown-it/markdown-it/blob/2b6cac25823af011ff3bc7628bc9b06e483c5a08/lib/common/html_blocks.js) is important too. If we don't, then the island gets wrapped inside a `<p>` tag and browsers do all sorts of weird things to prevent tags like `<div>` ending up inside tags like `<p>`, including re-ordering your HTML as it's parsed.

The `async` attribute on the script tag tells the browser not to block here, waiting to parse and evaluate the script. The work we did at build time means there's already something to see here, and it can become interactive when the browser has finished the critical rendering work.

The elephant in the ~~room~~ script tag is the bare import of `"preact"`. That works fine in Node when the library installed in your `node_modules` folder, but we need some extra tricks to pull this off in a browser. Enter, [import maps](https://github.com/WICG/import-maps).

In the site's `package.json` there's an import map, alongside the dependencies.Keeping it here helps remind me to update the mappings whenever I'm updating the dependencies.

```json
// package.json
"dependencies": {
  "preact": "^10.12.1"
},
"importMap": {
  "imports": {
    "preact": "https://esm.sh/preact@10.12.1",
    "preact/": "https://esm.sh/preact@10.12.1/",
  }
}
```

When present inside a `<script type="importmap">` this bit of JSON can tell the browser how to resolve JavaScript imports. When an island asks for `"preact"` in the browser, it's going to get `"https://esm.sh/preact@10.12.1"` instead.

I'm not wild about depending on an external service for this stuff, losing the ability to work on some parts of this site offline, but it seems better than bundling and minifying and serving my own versions of these libraries locally.

I tested [esm.sh](https://esm.sh/), [unpkg.com](https://unpkg.com/), and [skypack.dev](https://skypack.dev/) extensively whilst I was building Sietch. My opinion is that esm.sh is the most flexible and the most reliable when it comes to delivering packages as modules.

Browser support for import maps [isn't perfect](https://caniuse.com/import-maps) (it's currently sitting at about 74%), but there's [a shim](https://github.com/WICG/import-maps) we can use in the meantime.

I write here because _I_ enjoy writing. I don't share these posts anywhere, and I've never used analytics, so I have no idea how many people read these posts and which browsers they're using. I'm going to roll without the shim until someone complains!

## Cached Imports

The most painful problem here is that Node imports are cached. Here's the line of code where we import the component to render at build time.

```js
let mod = await import(file);
```

After the first call, the module goes into a opaque cache. Eleventy will detect changes we make to the file, but Node won't and we'll be rendering a stale version of the component.

We can't use old tricks like `delete require.cache[file]`. But we can use a new trick, like adding a cache busting query parameter to make Node forget that it's seen `file` before.

```js
let mod = await import(`${file}?v=${Date.now()});
```

The downside of this approach is that we're creating additional module instances each time the site builds. The old ones can't be garbage collected, because we have no access to the cache they're kept in. Memory usage on our Eleventy process goes up and up.

We don't actually want to be loading new instances of modules that haven't changed on disk. If a site has 20 different components and we change one of them, the cache should only grow by 1 during the next build.

Instead of using the current timestamp, let's use the modified time of the file in question.

```js
let fs = require("fs/promises");

let stat = await fs.stat(file);
let mod = await import(`${file}?v=${stat.mtimeMs}`);
```

## Hydration Modes

Render at build time, hydrate at runtime is a good default, but some components don't need to be hydrated, others rely on web features that don't work in a Node process.

I support two alternate hydration modes with a pair of shortcodes:

```html
<!-- Render at build time -->
{{'{% static-island "/islands/counter.js" %}'}}

<!-- Render at run time -->
{{'{% client-island "/islands/counter.js" %}'}}
```

For the static island this involves outputting the rendered HTML directly. No need to render a script tag or a wrapper element to mount at.

The client island needs to skip the step where we import the component and render it to a string, but otherwise it's no different.

## Lazy Hydration

One of my original goals was to defer all imports until the island entered the viewport. Dynamic imports inside an `IntersectionObserver` is the slightly scary sounding way to achieve this.

```js
<div data-island-id="aaaaa">...</div>
<script async type="module">
  let element = document.querySelector(`[data-island-id="aaaaaa"]`);

  new IntersectionObserver(async ([entry], observer) => {
    if (entry.intersectionRatio <= 0) return;
    let { h, hydrate } = await import("preact");
    let { default: component } = await import("...");
    hydrate(h(component, {}), element);
    observer.disconnect();
  }).observe(element);
</script>
```

Unfortunately the shim that makes import maps work in older browsers [can't polyfill dynamic imports](https://github.com/guybedford/es-module-shims#polyfill-edge-case-dynamic-import). There are some workarounds, but I think making the script tag `async` is probably good enough for now.

<aside>

💡 We could totally hack it with two script tags. The first would render the component, but would have an [invalid `type` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type) so that the browser would ignore it. The second script would create the intersection observer and enable the first script when the island came into view.

</aside>

## Stable IDs

Behold! The `uid` implementation of a man who is done with installing small packages from npm.

```js
let id = Math.random().toString(16).slice(2, 8);
```

This code gives each island a unique identifier. These identifiers aren't stable though, and islands will get different identifiers each time the site builds. This means that cached versions of otherwise unchanged posts will need to be invalidated in CDNs and browsers.

It would be better to use stable identifiers that don't change from build to build. A simple strategy (for single threaded environments) is to increment a page-local counter for each island.

```js
// outside the shortcode
let counters = {};
eleventyConfig.on("eleventy.after", () => (counters = {}));

// inside the shortcode
let id = (counters[this.inputPath] ||= 0);
counters[this.inputPath] += 1;
```

`this.inputPath` is the path to the page that Eleventy is rendering. Between builds we need to reset these counters so that they're assigned in the same order next time.

## Named Exports

Glaring at me in this code is `export default`. I don't like using default exports, because I think they encourage splitting files preemptively. I wouldn't split 5 related functions into separate files, so why would I split up 5 related components?

The challenge with named exports is a syntactic one. The way I'm handling props in Liquid's shortcodes doesn't leave much space for specifying a named export.

```liquid
{{'{% island "/islands/counters.js" "ConfettiCounter" %}'}}
```

Is this the name of the export? Or is this the name of the first prop? Checking for uppercase initials or an odd number of arguments are both fragile and hacky.

I decided to support named exports for islands that have been defined with a `src` and an `export` inside Eleventy's [data cascade](https://www.11ty.dev/docs/data-cascade/).

```yml
---
confetti:
  src: /island/counters.js
  export: ConfettiCounter
---
```

This does a good job at cleaning up some duplication _and_ solving the named export problem with a [single small change](https://github.com/danprince/danthedev.com/commit/944ba7a28d0fc4de1ab5e7d8ccb3d6c2440f815f).

## TypeScript & JSX

I've spent enough time making things for the web to know that I enjoy it more when I do it with types. The only question here is which flavour of TypeScript to use.

Writing TypeScript in a `.tsx` file is the best short term developer experience. You can express types with first class syntax. You even get JSX thrown in for free. The problem is that unless the _[ECMAScript Proposal for Type Annotations](https://github.com/tc39/proposal-type-annotations)_ is accepted, you can't run a `.tsx` file in a browser. _Even with_ that proposal, browsers may never be able to evaluate JSX.

Either we need to integrate a compiler into the toolchain, or to give up on JSX and write types in JS files with JSDoc comments. I've [waffled](/web-dev-without-tools/#static-analysis) about the latter approach here before.

Initially I went for a setup where TypeScript compiled everything in the `islands` directory. This works but it needs to run in parallel with Eleventy. That means a clean build before even starting Eleventy to ensure that the output files exist before shortcodes start reaching for them, and a throttle on Eleventy's watcher to prevent race conditions with the compiler in development.

It also creates an awkward problem if you want to `.gitignore` the compiled JavaScript. You probably do. Eleventy's watcher ignores everything that Git ignores. Instead of watching the files that the site will use, you have to watch the source files and do the throttling trick mentioned above.

I also tried turning `.tsx` into a [custom template language](https://www.11ty.dev/docs/languages/custom/) and having [esbuild](https://esbuild.github.io/) transform the files, with similarly awkward results.

Back to JSDoc and calling `h` like a madman, I guess!

What I do appreciate about this setup is the transparency. All the files in the `islands` directory are copied across into the site's output directory. I can co-locate a CSS file next to a JS file and that colocation is preserved at runtime. Nothing is transpiled, or bundled. No need for source maps, no mapping paths from `.tsx` to `.js`. I get type checking, and I can still augment those types with `.d.ts` files when I want to express something more complex.

## Conclusion

This idea is currently at the proof-of-concept stage. It still needs a trial by fire with a highly interactive article.

One of the changes I'm considering is supporting a "vanilla" component format, [like I did in Sietch](https://sietch.netlify.app/reference/islands.html#vanilla). Vanilla islands can render and hydrate without any dependencies. They're appropriate for _tiny_ bits of interactive content like the button island on this page.

There are rough edges when you work directly with browsers. Tools and compilers can help you forget about them, but _should_ you forget about them? I think the future of building for the web without those tools is looking brighter and brighter.

Here's the [pull request](https://github.com/danprince/danthedev.com/pull/32) with the full implementation.
