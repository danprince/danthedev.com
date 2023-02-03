---
title: Islands Examples
data:
  count: 10
styles:
  - /tailwind.css
---

I want to embed interactive content into my Eleventy site. Here's the wishlist:
- TypeScript
- Rendered at build time with optional hydration
- Support for Preact
- Maybe support for Web Components
- Maybe support for rendering to a string
- No additional tools running.

Here are the problems:
- Rendering TypeScript at build time is tricky. Node can't parse TS files.

What does it look like if I try and use a tool-less setup? Islands have to be written in JavaScript. At runtime this can be web components, or Preact, or simple string stuff. But what happens at build time? Don't really want to use CommonJS. Can I use ESM from Eleventy's process though? Maybe with esbuild-register or `"type": "module"`. Think there are problems with cache busting ESM imports.

What about a middleground with `tsc -w` and import maps? I'd get JSX and TS. No bundling but that's ok, right?

The _hydrated_ island is rendered at build-time and then hydrated at runtime.
{% island "/js/Counter.js" "value" 1 %}

The _static_ island is rendered at build-time and has no code shipped at runtime.
{% static-island "/js/Counter.js" %}

The _client_ island is _not_ rendered at build time, 
{% client-island "/js/Counter.js" %}

This island takes its props from static data declared at build time.
{% island "/js/Counter.js" "value" data.count %}

Thought I could be smart by cache busting using the file's modified time as a query parameter. This doesn't really work though, because TypeScript modifies all files when it outputs.

Suddenly occurs to me that there isn't a way to cache bust transitive imports. This doesn't actually seem to matter.

## Challenges
- ESM
- SSR + Cache busting
- TypeScript/JSX
- Bundlers
- Import maps / shim
- Hydration modes
- Wrapping it up as a plugin
- Preloading (import map conflict)
- SRI
- esm.sh redirects (necessary for esm to esbuild based on user agent)
- Split preact (preact, hooks, jsx-runtime)
- Can't ignore _src from build but still have it trigger watch changes
- Liquid props syntax
- Custom mount tag (`<eleventy-island />`)
- Minification
- Fingerprinting assets
- Styles
  - All global
  - CSS-in-JS (SSR difficulties)
  - Inline everything?
- Solve the `__dirname` problem.
  - Parameterise `getStaticProps` with dir
- Is `getStaticProps` idiomatic? Would it be better to load this from Eleventy?
- Duplication of `importMap` and `devImportMap`. Merge or automate?

Experimenting with TypeScript only structure. The two halves of the codebase have to compile to different formats (client side needs to compile to ESM for browsers and build-side needs to compile to CommonJS for Eleventy to import).

Build-side code can't be written in ESM then compiled to CJS because it needs a CJS extension. TypeScript can't do that unless you write a `cts` file.

```
src/
  eleventy.ts
  _data
  _11ty
  _includes

dist/
posts/
package.json
```

Unsolved problems:
- Use TypeScript everywhere?
  - 11ty config
  - _data files
  - _11ty plugins
  - _includes layouts
  - Seems like this just isn't possible at the moment

Hydration directives
- On visible
- On idle - don't care about this

```liquid
<!-- what I do now -->
island "/js/Counter.js" 
client-island "/js/Counter.js"

<!-- alternative with shortcodes -->
island-on-visible "/js/Counter.js"

<!-- alternative with filters (default is static) -->
island "/js/Counter.js"
island "/js/Counter.js" | static
island "/js/Counter.js" | hydrate | visible
island "/js/Counter.js" | client

<!-- with nunjucks -->
island "/js/Counter.js" hydrate=visible
```

Messy. Just make all islands display on visible.
