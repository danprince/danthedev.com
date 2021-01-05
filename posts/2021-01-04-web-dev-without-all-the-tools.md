---
title: Web Dev (Without All the Tools)
---

Most frontend web development projects rely on a complex stack of tools that turn code into code, or code into errors. In a given project, there's a good chance you'll see some combination of the following:

* [npm][npm] and [Yarn Classic][yarn] or [Yarn][yarnv2] or [pnpm][pnpm] for managing dependencies.
* [Webpack][webpack] or [Rollup][rollup] or [Parcel][parcel] for bundling code and assets into minimal distribution artifacts.
* [ESlint][eslint] or [TSlint][tslint] for linting.
* [Uglify][uglify] or [Terser][terser] or [babel/minify][babel-minify] or [Closure Compiler][closure-compiler] for minification.
* [TypeScript][typescript] or [Flow][flow] for enhancing JavaScript with static type checking capabilities.
* [Babel][babel] for converting modern code into code that will run in more environments.
* [PostCSS][postcss] or [Sass][sass] to improve on the syntax of CSS.
* [Prettier][prettier] for formatting code.

These tools solve important problems and you can make a strong case for any of them on an individual basis. They are open source projects, maintained by generous programmers who dedicate significant amounts of free time to improve tooling for the rest of us.

The problems arise when these tools are considered together. They are often non-trivial to configure, especially when correctly configuring one depends on correctly configuring another first. Those are just the first twenty current tools that I could think of off the top of my head. I would hedge a bet that there are some sprawling, dark cornered codebases out there that use even more. I've worked in at least one that used eleven!

The combinatorial complexity of stacking these tools is barrier to entry that can cause beginners to give up before they ever write a line of code.

It's not just a problem for less experienced devs either. Sometimes you'll introduce a simple version mismatch during an upgrade, then find yourself [without a towel](https://en.wikipedia.org/wiki/Towel_Day) or any useful error messages, hand-editing code inside `node_modules`, wondering where your life went wrong.

These experiences encourage people towards integrated tools like [Create React App][cra] and zero configuration bundlers like [Parcel][parcel]—opting to trade some control for a lower maintenance burden. These are good tools! Time spent configuring, fixing and upgrading tools is time you could have spent ideating, creating, or solving your problem.

Most of the tools mentioned here were created to solve problems that you won't have while you're learning web development, or building a prototype, or a side project. The browser has matured enough that you can build a complex app without any of the above tools—or resorting to old school script tags and global variables.

I want to share my setup for building _small projects_ that don't rely on hundreds of megabytes of development dependencies. There are still some rough edges, but removing the reliance on build tools has helped restore some of the joy that I first felt when starting out with web development many years ago.

## Modules
It all starts with an `index.html` that imports a [module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) directly.

```html/8
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Don't Panic</title>
  </head>
  <body>
    <script type="module" src="index.js"></script>
  </body>
</html>
```

The `type="module"` attribute enables the `import/export` module syntax inside `index.js` and any other modules that it imports.

```js
// index.js
import { VogonFleet } from "./vogon-fleet.js";

// Make way for a hyperspace bypass!
let fleet = new VogonFleet();
```

After fetching `index.js` the browser will fetch any other modules that file imported and so on until all the page has all the code it requires.

This can concern developers who worry about waiting minutes for thousands of tiny files to import sequentially. In my experience this tends only to happen when you insist on putting all of your classses and functions into separate files. I don't know how this became so popular, but if the reason is that you find it easier to navigate to code through the file system, then [get better tools for navigating!](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition)

I follow a simple rule. Put stuff that is conceptually related into one file. If that file gets uncomfortably broad, then narrow the concept, split and repeat. As ideas become concrete and you start to understand the subdomains of the problems you are solving, natural boundaries tend to emerge.

The one caveat with modules is that they don't work without a file server that understands MIME types. So you can't open your [`index.html` over the `file://` protocol](https://stackoverflow.com/questions/47403478/es6-modules-in-local-files-the-server-responded-with-a-non-javascript-mime-typ).

It's likely that you already have Python installed and can use it to start a HTTP server.

```shell
# run this in your project directory
python -m SimpleHTTPServer
```

If you don't have Python, or you want a server that will automatically reload the page after you make a change (I always want this) then I recommend [live-server](https://github.com/tapio/live-server) or [Browsersync](https://browsersync.io/). If you want a binary that doesn't require npm, then try [devd](https://github.com/cortesi/devd).

## Dependencies
Traditionally, using other people's code has required some combination of [npm][npm] and [yarn][yarn] to download those modules (and their dependencies) from the npm registry. By default, those modules (and their dependencies) can [execute arbitrary code](https://blog.npmjs.org/post/141702881055/package-install-scripts-vulnerability) on your machine after installation, so there's a lot of trust involved when you hit install.

(If you use npm at all, then you should probably run `npm config set ignore-scripts true` unless you want to feel very silly one day).

You can bypass npm entirely by importing your dependencies directly from a CDN instead. I like to use [Skypack][skypack] and [UNPKG][unpkg]. 

Goodbye!

```js
// $ npm init
// $ npm install --only=dev webpack
// $ npm install preact@10
import * as Preact from "preact";
```

Hello!

```js
import * as Preact from "https://cdn.skypack.dev/preact@10";
```


If you only use a dependency in a single file, then importing it directly works fine. As soon as you use a dependency in multiple files, keeping the import URL in sync can become error prone.

I prefer to re-export external dependencies from dedicated files in a folder that I usually call `lib`.

```js
// lib/preact.js
export * from "https://cdn.skypack.dev/preact@10";
```

Other modules can import this file instead.

```js
import * as Preact from "./lib/preact.js";
```

[Import Maps](https://github.com/WICG/import-maps) will eventually solve this problem, but that's still [some time away](https://caniuse.com/import-maps) for now.

Skypack also wraps [CommonJS code](https://nodejs.org/docs/latest/api/modules.html) with an interop layer, so that you can import older packages too.

I'm generally happy with this setup, but the one rough edge that I do run into is the need for a constant internet connection during development.

This time last year I was crossing Russia by train. Lots of free time and very little connectivity. Not a typical development environment perhaps, but sometimes you don't have internet access and it's frustrating when that gets in the way of working. I was building [a web app](https://github.com/danprince/siberia) with a single dependency, which I ended up vendoring (which still works brilliantly as an alternative) during a window of 4G, whilst stopped at a city along the way.

## Syntax
Historically, some browsers struggled to keep up with the latest specifications for the web. Supporting a reasonable percentage of users required you to restrict yourself to using a _safe_ subset of languages (e.g. ES3 or ES5). Eventually, source-to-source compilers like [Babel][babel] appeared, which rewrite modern syntax in terms of safer syntax that works in older browsers.

With the growing number of syntactic improvements that have come to JavaScript in recent years ([async/await][async-await], [modules][modules], [destructuring][destructuring], [classes][classes], etc) and the growing proportion of users on evergreen browsers (browsers that are automatically upgraded to current versions), the list of reasons to 'transpile' code for compatibility is shrinking, especially for smaller projects.

At the time of writing, modules are supported by [92.66% of users globally](https://caniuse.com/es6-module), async functions are at [94.11%](https://caniuse.com/async-functions), classes are at [95.51%](https://caniuse.com/es6-class), and so on. If [GitHub](https://docs.github.com/en/free-pro-team@latest/github/getting-started-with-github/supported-browsers), [YouTube](https://support.google.com/youtube/answer/175292?hl=en), [Discord](https://twitter.com/discord/status/944929631966285824), [Spotify](https://support.spotify.com/us/article/webplayer/), and  [Slack](https://slack.com/intl/en-gb/help/articles/115002037526-Minimum-requirements-for-using-Slack) don't support IE11, then you probably don't need to for your side project either.

Not all popular syntax is on a standards track that browsers will implement though. [JSX](https://reactjs.org/docs/introducing-jsx.html) is a syntax extension for React (but now used by plenty of other frameworks) for writing declarative element expressions inside JavaScript files.

Unless you are living in an alternate timeline where [E4X wasn't deprecated long ago](https://en.wikipedia.org/wiki/ECMAScript_for_XML), your browser considers the following code to have syntax errors.

```jsx
function PanGalacticGargleBlaster() {
  return (
    <Mixer>
      <JanxSpiritJuice bottles={1} />
      <SantraginusSeaWater />
      <ArcturanMegaGin cubes={3} />
    </Mixer>
  );
}
```

But unless you've been hiding from the JavaScript ecosystem for the past 7 years, you'll have seen a lot of JSX around. It's a popular way to describe markup for component based frameworks because of the visual parity with the HTML that they eventually generate.

You may also know that JSX is a syntax alternative for a less succinct way to express the same idea with regular code.

```js
import { h } from "./lib/your-favourite-ui-framework.js";

function PanGalacticGargleBlaster() {
  return (
    h(Mixer, null,
      h(JanxSpiritJuice, { bottles: 1 }),
      h(SantraginusSeaWater),
      h(ArcturanMegaGin, { cubes: 3 }),
    )
  );
}
```

Therefore you can skip the build step and write your components like this instead, which is what I usually do with [Preact][preact].

Alternatively you can use a runtime library like [htm](https://github.com/developit/htm) which uses tagged template literals to stay closer to the original JSX syntax.

```js
import { html } from "./lib/htm.js";

function PanGalacticGargleBlaster() {
  return html`
    <${Mixer}>
      <${JanxSpiritJuice} bottles=${1} />
      <${SantraginusSeaWater} />
      <${ArcturanMegaGin} cubes=${3} />
    </${Mixer}>
  `;
}
```

I'm less keen on this approach because it comes at the cost of type safety. I was initially hopeful that some black magic with [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) could change this, but I think the recursion limits probably prevent that. For now, type checkers can't verify these kind of components like they can with JSX or the equivalent direct syntax.

The other non-standard syntaxes you might come across would be type annotations (and a handful of other syntax extensions) from [TypeScript][typescript] or [Flow][flow]. The next section will mostly focus on achieving type safety without a compiler.

## Static Analysis
If you write a significant amount of JavaScript in any moderate sized codebase, you'll know that it's not easy to predict how existing code works. Imagine you've arrived in a new codebase and you see the following function signature.

```js
function getTheAnswer(config) {
  // ... lots of other code ...
}
```

You know you want the answer, but what should you pass as an argument? A reasonable guess might be an object, but as the parameters weren't documented, you have no idea which properties to try. Usually this involves hunting around the codebase for other calls to this function to use as examples, or worse, reading the entire function body to see which properties are accessed.

This problem doesn't exist when you use type annotations and a static type checker. Your editor will let you know exactly which properties are required, which are optional and the type of each one.

It's absolutely true that you don't _need_ a type checker for smaller projects, but once you've spent any significant time using them, going back to untyped JavaScript is worse than [listening to Vogon poetry](https://en.wikipedia.org/wiki/Vogon#Poetry). I'll be damned if I have to give up type safety for my small projects.

TypeScript actually exposes a large subset of its functionality through [JSDoc annotations](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) that work in JavaScript files, and you can ship these same files to a browser without a build step.


Goodbye!

```typescript
// deep-thought.ts

function getTheAnswer(
  life: number,
  universe: number,
  everything: number
): number {
  // TODO: supernatural supercomputing!
}
```

Hello!

```js
// deep-thought.js

/**
 * @param {number} life
 * @param {number} universe
 * @param {number} everything
 */
function getTheAnswer(life, universe, everything) {
  // TODO: supernatural supercomputing!
}
```

Most TypeScript syntax can be converted over to JSDoc annotations, which are usually more verbose than the original syntax, but still enable all the same features for type checking and refactoring (renaming symbols, finding jumping to definitions and implementations, etc). It's also worth mentioning that often you can skip the annotations and let TypeScript infer the types too.

Is it as pleasant to write as regular TypeScript syntax? No, but it's not as bad as you might think either. And for those times when you have lengthy unions, or complex conditional/mapped types, you can use TypeScript syntax to export or declare them globally in a `.d.ts` file.

If you're not convinced, then go and check out the source for a large project, like [Webpack](https://github.com/webpack/webpack), which uses JSDoc syntax extensively throughout its codebase.

A lot of people are using editors like VS Code, that come with a copy of TypeScript. All you need is to add a [`tsconfig.json`/`jsconfig.json`](https://code.visualstudio.com/docs/languages/jsconfig) to the root of your project and the editor will jump into action.

If (like me) you don't use one of those editors, it's less likely you'll have a copy of TypeScript ready to go, and will therefore need either a global or local installation of the `typescript` package (which one you choose will depend on how picky you need to be about versions). This means re-introducing npm, but in a fully optional way. Your code will continue to work fine with or without TypeScript installed.

You can opt-in to using other static analysis tools in a similar way. Tools like [eslint][eslint] can enforce stylistic or qualitative rules about your code. The more developers you have working on the same codebase, the more important this becomes, especially when there's a variety of experience on the team. I don't actively use a linter, so I can't comment too much here.

## Bundling & Minification
The final piece of the puzzle is bundling and minifying your code for delivery. The simple (but boring) answer here is that for small projects, you don't need to.

Be realistic about how much code you are actually delivering, and how much of it will be coming from your servers, compared to coming minified (and probably cached) from a CDN. 

Ask yourself who is likely to use the thing you're making. Is it business critical that the page loads in the first 50ms so you can convert viewers into customers? Or is it something you're building for fun that can be safely and reliably cached for future visits.

Benchmark your code. Fire up the devtools and [throttle the network](https://developers.google.com/web/tools/chrome-devtools/network#throttle) to whatever speed you need your page to be snappy at. Is it too slow? Is loading and parsing code the bottleneck? That's the time to start thinking about integrating a bundler and minifying your code. Solve the problem you have right now, not for one you might have in the future.

Depending on when and where (and if) you eventually deploy your project, there's a good chance that you'll be able to enable gzip compression, which can go a long way to reducing the overall size of larger files (but will never be comparable to the savings of bundling, minifying, and _then gzipping_).

If you deploy to a platform like [Netlify][netlify] you can enable [asset optimization](https://www.netlify.com/blog/2019/08/05/control-your-asset-optimization-settings-from-netlify.toml/) for minifying and bundling JS and CSS as part of their build step. The downside is that this process is a bit opaque and it's not always clear what the end result will be on your code until you deploy it and look at the source.

It's also easy to forget how cool View Source still is for unminified code. If you've been working on something interesting, then it's a wonderful feature of the web, that other programmers can learn from your code without any reverse engineering.

## Styling
[Flexbox](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox), [Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout) and [Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) have drastically improved CSS for styling applications, and they're all supported (without prefixes) by more than 94% of users globally. [[1]](https://caniuse.com/?search=flexbox) [[2]](https://caniuse.com/css-variables) [[3]](https://caniuse.com/?search=grid)

For those that prefer to write regular old CSS: you're in luck because you don't have to change much about your workflow.

If you're using a bundler to import your stylesheets directly from JS files, then you'll either have to adapt to importing your CSS files from your HTML, or from [other CSS files](https://developer.mozilla.org/en-US/docs/Web/CSS/@import).

If you're not writing CSS directly, then you probably fall into one of the following camps.

### PostCSS / Sass
These are languages to which you will have to say goodbye, if you want a tool-free setup. For some people this will be a deal-breaker. All I can say is that CSS is probably better than you remember it being.

### CSS-in-JS
If your library of choice works without a build step, then you can pick your flavour of CSS-in-JS and load it from a CDN, the same as any other library.

### Atomic Styles
If you prefer a utility-first framework like [Tailwind](https://tailwindcss.com/) then you can [use that via a CDN too](https://tailwindcss.com/docs/installation#using-tailwind-via-cdn).  There are also promising looking variants—like [Twind](https://github.com/tw-in-js/twind)—that aren't as tightly coupled to PostCSS for configuration.

## Unsolved Problems
I mentioned some of the rough edges already, but here are the ones that need more careful consideration.

### Assets & Caching
Most bundlers have a good story for importing and bundling non-JavaScript assets like images and stylesheets. You can usually configure specific handling for different types of assets, like applying an optimisation pass, or even inining them directly. 

Many can also apply a content based fingerprint to the resulting URL of a bundled asset, which enables indefinite caching strategies. If the content changes, the hash changes, and the caches will update. Assets without fingerprints can't be cached as effectively, because you may eventually deploy a new version of the asset with the same name, whilst users still have a cached version of the old one.

One extreme workaround is to use a [`Cache-control: no-cache`](https://tools.ietf.org/html/rfc7234#section-5.2.2.2) header to guarantee that your assets are always up to date.

Another is to add a poor man's fingerprint that you update each time you update an asset, but this doesn't scale up for lots of projects.

```html
<!-- changing the asset name with each update -->
<img src="/banner-v2.png" />

<!-- or with query params (no change to file names) -->
<img src="/banner.png?v=2" />
```

This might be another deal-breaker, but it's worth mentioning that fingerprinting is another post-processing feature that is [built-in to Netlify](https://www.netlify.com/blog/2015/09/11/instant-cache-invalidation/), although I'm fairly sure this only works for content that's linked directly to your HTML.

### Third Party Types
Normally you would install type definitions directly from a package in the npm registry, or by installing the corresponding `@types/*` package, depending on the library. TypeScript understands how to interpret both, but if you're importing your dependencies from a CDN, then you won't have either.

However, you can configure TypeScript to interpret remote imports as references to local files instead—if you're happy to install the types during development. Here's an example `tsconfig.json` for mapping Skypack imports to node_modules.

```json
{
  "compilerOptions": {
    "checkJs": true,
    "allowJs": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": {
      "https://cdn.skypack.dev/*": ["node_modules/*", "node_modules/@types/*"]
    }
  }
}
```

This [paths](https://www.typescriptlang.org/tsconfig#paths) configuration tells the type checker to resolve Skypack imports to local files. For example an import for `https://cdn.skypack.dev/preact` would be resolved to `node_modules/preact` and then `node_modules/@types/preact` in that order. Depending on your setup, you may also need mappings for resolving URLs with pinned versions and minification flags too.

You don't have to install the types with npm either, often you can vendor straight them into your project instead. For example:

```bash
# assuming you have lib/preact.js
curl https://cdn.skypack.com/preact/src/index.d.ts > lib/preact.d.ts
```

Like type checking, this is also an opt-in step. Another programmer without npm or TypeScript installed can still work on this code without running into environmental setup errors.

This is the point that has caused me the most pain so far, but I'm getting more comfortable foregoing types for dependencies that have a minimal contact point with my code (a small handful of discrete function calls) vs libraries that I use extensively across multiple files in my codebase, where I opt to install a strictly development version of the libary (or just its types). This involves a bit of version syncing, but for small projects, that's generally not too bad.

In an ideal future, TypeScript would take a leaf out of Deno's book and respect the [`X-TypeScript-Types` header](https://deno.land/manual/getting_started/typescript) for any remote imports, but that's not a goal for TypeScript in the short term, so you might be stuck with the current situation for a while.

## Migrating

Sometimes you will hit one of the afforementioned 'deal-breakers' which leaves you with no other choice than to add a build step to your codebase. Time to rewrite everything? Not at all. The majority of your code is already written with relative module imports that all bundlers understand.

You'll probably want to switch to using local dependencies, but bundlers with configurable module resolution can alias your existing CDN URLs to local ones to ease the transition.

## The Future

The future of tooling for web development is far from bleak and despondent though. In fact, there are plenty of tools that represent an exciting direction of travel for larger projects with teams.

* [Rome][rome] promises to be a unified toolchain for the whole of the web. With so many source-to-source tools that separately parse and print code, it seems like a no-brainer to build a set of tools that can all work on the same syntax tree. Also cool: [no dependencies](https://github.com/rome/tools/blob/9ddf92ba7944b2013c4ae439242def512b32ba38/package.json#L8-L9).
* [Snowpack][snowpack] is a module-first build tool from the team behind [Skypack][skypack]. It takes advantage of the fact that most browsers support modules now, and therefore spends no development time stitching your code together to create bundled files.
* [Vite][vite] is another module-first build tool, from the team behind Vue. When I have a project that outgrows my minimal tool setup, Vite is my first port of call. I don't actually use Vue much, but Vite works brilliantly regardless.
* [esbuild][esbuild] is a performant bundler and minifier written in Go that is actually used in Snowpack and Vite. I'm generally excited about tools for JS that are written in faster compiled languages.
* [swc][swc] is another performant JavaScript compiler with a bundler, written in Rust.
* [Deno][deno] is a reimagining of Node.js, but with first class TypeScript support and without a central package repository. Less of a tool and more of a platform, but it comes with a [unified toolchain](https://deno.land/manual/tools).

---

Someone starting out with web development can use these techniques to create a complex app before they ever think about installing Node and npm. A burnt out web developer can breathe fresh life into their next project by sidestepping tool configurations and boilerplates.

If you end up making something cool, more people are likely to want to play with it and contribute if they don't have to spend 5 minutes installing tools to get it running.

There used to be a joke that went something like this:

> Just use jQuery.
> 
> How do I install jQuery?  
> Use Bower.  
> What's Bower?   
> It's a package manager.  
>
> How do I install Bower?  
> Use npm.  
> What's npm?  
> It's a package manager.  
>
> How do I install npm?  
> Use brew.  
> What's brew?  
> It's a package manager.  
>
> How do I install brew?  

I say this as someone who used to use [Bower][bower] without a sense of irony. It's possible to be grateful for the ways that tools have advanced modern development, without forgetting that they can also create a ridiculous mess.

These days it's either tricky or impossible to get some of my old projects running again because the tools I used are now outdated. At the time, they usually suggested using a global installation, so I have no idea which versions I was using and I don't have enough motivation to retroactively find out.

Who knows what web development tooling will look like in a few decades time, but unless browsers break their long-standing promise on backwards compatibility, code that doesn't need to be compiled will continue to work.

[rome]: https://rome.tools/
[npm]: https://www.npmjs.com/
[yarn]: https://classic.yarnpkg.com/lang/en/
[yarnv2]: https://yarnpkg.com/
[pnpm]: https://pnpm.js.org/
[webpack]: https://webpack.js.org/
[rollup]: https://rollupjs.org/guide/en/
[parcel]: https://parceljs.org/
[eslint]: https://eslint.org/
[tslint]: https://palantir.github.io/tslint/
[uglify]: https://www.npmjs.com/package/uglify-js
[terser]: https://terser.org/
[babel-minify]: https://github.com/babel/minify
[closure-compiler]: https://developers.google.com/closure/compiler
[typescript]: http://typescriptlang.org/
[flow]: https://flow.org/
[babel]: https://babeljs.io/
[prettier]: https://prettier.io/docs/en/cli.html
[cra]: https://github.com/facebook/create-react-app
[react]: https://reactjs.org/
[postcss]: https://postcss.org/
[sass]: https://sass-lang.com/
[less]: http://lesscss.org/
[skypack]: https://www.skypack.dev/
[unpkg]: https://unpkg.com/
[async-await]: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await (MDN intro to async/await)
[modules]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules (MDN article on modules)
[destructuring]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment (MDN article on destructuring)
[classes]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes (MDN article on classes)
[netlify]: https://www.netlify.com/
[snowpack]: https://www.snowpack.dev/
[vite]: https://github.com/vitejs/vite
[esbuild]: https://github.com/evanw/esbuild
[swc]: https://github.com/swc-project/swc
[deno]: https://deno.land/
[bower]: https://bower.io/
[preact]: https://preactjs.com/
