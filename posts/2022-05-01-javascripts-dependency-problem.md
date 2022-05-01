---
title: JavaScript's Dependency Problem
cover:
  alt: Lego bricks
  url: /covers/lego-bricks.png
---

Dependency management in modern JavaScript has become comically and ironically unmanageable. `node_modules` has become the black box that allows other programmers to solve problems for you.

Isn't this the point of abstraction, after all? You don't need to understand internal combustion engines and fuel injectors to drive a car.

But corporate entities manufacture those engines with legal guarantees, regulatory frameworks, and an international reputation to maintain. When an engine fails, mandatory insurance covers recovery, diagnosis, and repair.

There are no regulatory guarantees for third-party code. When a product-crippling bug appears in the middle of the night, you aren't insured, and there's no one to sue. There's no recovery team coming. 

When you trace it back to the wonky line of code in one of your "blazing fast" dependencies, you can get angry on GitHub, but that's about it. You didn't pay for that code, and that means the chain of responsibility stops with you.

Dependency management in JavaScript has become unmanageable because developers started to think of themselves as the drivers in this analogy. They're supposed to be the mechanics.

I don't blame them though. Anyone who's worked in a large JavaScript project knows that the `node_modules` folder is a wild place. The average codebase has hundreds, if not [thousands of transitive dependencies][growing-pains] and trying to audit them all is an exercise in futility.

With nearly two million packages overall, the npm registry is already an order of magnitude larger than equivalent registries for other programming languages.

![](/package-stats.png)

Why does JavaScript have so many packages?

The simple answer is that JavaScript is the most popular programming language, but we're not interested in simple answers today. Like any complex problem, there are factors to consider individually.

### Standard Library
JavaScript has a unique evolutionary path because of its significance on the web. The commitment to backwards compatibility is maintained by a committee who try to ensure that the growth of the language is indefinitely sustainable.

Change happens slowly with append-only language design. We see a handful of extensions to the language specification each year. At this velocity, it becomes hard for JavaScript to ever seriously compete against languages with comprehensive standard libraries.

To make matters worse, both Node.js and the web have been cursed with mid-level standard libraries. Too low-level to use directly in applications, but high-level enough that the average developer can see opportunities for abstractions.

This created a culture of using libraries to solve all but the simplest problems. If you want to build a user interface, you reach for something like React, not `document.createElement`. If you want to build a server, you reach for something like Express, not `http.createServer`. Even before npm existed, working directly with the DOM was uncommon. Almost everyone reached for jQuery.

When programmers learn that libraries are the best way to solve problems, then they solve novel problems (real and imagined) with novel libraries. More programmers, more problems. More problems, more packages.

### External Tools
The majority of the dependencies for modern frameworks are only used during development. This is largely because JavaScript has no central distribution, and the most common runtime (Node.js) ships without any tools for managing complex codebases.

Instead, you learn to reach for libraries. Projects often begin with the installation of a formatter, a linter, a bundler, a type checker, a minifier, a testing framework, or some combination of the above.

These tools are developed in relative isolation. The formatter knows nothing about the linter, the linter knows nothing about the type checker, and so on. These tools need to be wired together with plugins and configuration files. This creates another explosion of supporting packages.

### Tribalism 
As the [lingua franca of the web][lingua-franca], people from all kinds of programming backgrounds use JavaScript at some point in their careers.

This melting pot of ideas, opinions, and subcultures helps the language learn from the successes and failures of other languages. It also fragments the identity of the language, the idioms from which people learn, and the ecosystem as a whole.

Almost every popular package that solves a problem with object oriented programming, has an alternative that provides the same functionality with a pure functional flavour. For each package which embraces the dynamic aspects of the language, there's another which constrains them with static types. Every school of thought believes that their way is best, and they all rewrite existing libraries to prove it.

These rivalries don't stop at the boundaries of linguistic paradigms either. Some language features have proven to be controversial enough to create their own divisions. It's easy to forget how many libraries were duplicated whilst the community took a few years to decide that promises were probably better than callbacks.

### Small Modules
Many JavaScript applications become interactive after downloading the source code. As a rule of thumb, shipping less code makes for a better user experience and that has created a whole new class of package duplication.

JavaScript suffers from an above-average problem with technical debt. Partly because the dynamic nature of the language allows you to write code in unsustainable ways, and partly because the popularity of the language creates demand for adjacent problem solutions.

Maturing packages tend to lose velocity as they grow in size, and developers begin to search for alternatives that solve a vertical slice of the problem with significantly fewer lines of code.

Eventually some of the alternatives mature and the cycle repeats itself. It only takes a few generations of splitting to arrive at atomic packages like `left-pad` and `is-even`.

For the authors, these tiny modules are easier to reason about in isolation, which makes them easier to test, easier to optimise, and easier to version. Consumers can install the exact set of tiny packages they need without worrying about whether their toolchain will "tree shake" everything correctly.

The dream is a lego brick utopia. Each package solves a single problem, and they all slot together neatly [to build a lego castle][small-modules].

However, not everyone is putting lego into the bucket. The classical inheritance fans are using wooden bricks, the functional folks prefer magnets, the reactive streams crowd have marbles, and the well-meaning but misguided rookies are pushing playdough into the gaps.

There's a reason that toy shops don't sell lego bricks individually. Small modules dilute the coherence of the ecosystem as a whole.

### Inexperienced Developers
For better or worse, new programmers often start with JavaScript. It's a deceptively simple language, and the permissive design means you can become productive relatively quickly. Throughout their learning experiences, many arrive at [false summits][false-peaks] where they mistakenly assume they have mastered the language.

These inexperienced but overconfident developers tend to discover that it is harder to make a meaningful contribution to an existing package than it is to create a simpler version from scratch.

Recreating existing software is a wonderful way to learn. However, npm set the bar for publishing a package so low that these learning exercises have significantly diluted the value of the average package in the registry.

There are hundreds of thousands of unused and unmaintained packages by developers who thought they were making a meaningful contribution to the ecosystem by publishing  half-baked thought experiments with catchy names and unusually polished logos.

I'm as guilty as anyone else. [My own npm profile][npm-danprince] lists some shamefully empty packages that my younger self thought would grow into popular and useful open source projects.

Not everyone there has misplaced their confidence though; some just want to look better on paper, some don't realise that they're solving a solved problem, and others are so afraid of repeating themselves that they package up and publish every tiny abstraction they ever stumble upon.

### Squatters
The name of a package is a critical part of its identity. It's the part that users have to type out every time they install it. Short names are faster to type, and catchy names are easier to remember. Despite squatting being a [violation of npm's terms of use][squatting] many package names are registered prematurely and never used.

The darker side of this problem is known as [typosquatting][typosquatting] and it involves registering malicious packages with deliberately similar names to popular ones. After you hit `npm install` your system is at the mercy of the `postinstall` scripts of whichever package name you typed. On a good day a misspelling results in a registry miss with a friendly warning. On a bad day, you [send your production environment variables to a bad actor][crossenv-malware].

npm has [naming rules][new-rules] that prevent some common techniques for typosquatting, but while humans have fat-fingers and slow response times, we'll keep making mistakes, and bad actors will capitalise on them because it is laughably easy for them to publish packages on npm.

## Where Do We Go From Here?
It's too late for npm to ever become a high quality package registry. [Death by a thousand cuts][lingchi] has taken its toll on the ecosystem and the idea of a fresh slate like [Deno][deno] is appealing to many.

There's still plenty that we can do to improve the current story though.

We can support the [TC39 proposals][tc39] that take the best ideas from libraries and turn JavaScript into a better general purpose programming language.

We can encourage the trend towards integrated tools. Node's move towards a [standard test runner][node-test] is a step in the right direction. The fewer tools we need to install to be productive, the better.

We can prefer lego sets to lego bricks. Use the standard library when possible. Don't use one-line packages when the equivalent method exists in `lodash`. The current generation of build tools are great at removing unused code from your bundles, and unifying around high quality packages gives the whole community a shared frame of reference.

We can aim to create a culture of contribution. It's easy to shame mature packages for having clunky codebases and huge bundle sizes, but it's better to join the conversation to see what is being done and how you can help. When popular packages are improved rather than abandoned, everyone wins.

We can make a habit of picking one package with many contributors, rather than many packages with one contributor. We can make a habit of picking the package with zero dependencies.

We can reduce tribalism by being open to solutions written in different programming styles, even when that means sacrificing some purity of our own projects.

We can take more responsibility when deciding to publish packages. Is the problem that we're solving real or imagined? Have we shared the codebase with other developers to find out whether the solution is generally applicable? Are the appropriate tests and documentation in place? Are we committed to maintaining the codebase, or is it just a completed weekend project?

If I was designing a new package registry for JavaScript, I would reserve the top level namespace for packages that were manually verified to be high quality and important. Anyone would be able to publish packages into their own scope (e.g. `@danprince/foo`), but to be published without a scope (e.g. `foo`) the package would need to reach a high integrity score (some combination of downloads, contributors, and published versions) and would need to undergo a manual quality and security review.

Unscoped packages would be blessed as part of the ecosystem, a mark of quality which would help us all navigate the registry. If we can have a committee that decides on language features, I see no reason why we couldn't have a similar process for blessing packages too.

We don't need two million packages. We probably don't even need two thousand.

[lingua-franca]: https://blog.codinghorror.com/javascript-the-lingua-franca-of-the-web/
[small-modules]: https://blog.sindresorhus.com/small-focused-modules-9238d977a92a
[false-peaks]: https://en.wikipedia.org/wiki/False_peak
[typosquatting]: https://snyk.io/blog/typosquatting-attacks/
[crossenv-malware]: https://blog.npmjs.org/post/163723642530/crossenv-malware-on-the-npm-registry
[new-rules]: https://blog.npmjs.org/post/168978377570/new-package-moniker-rules
[transitive]: https://en.wikipedia.org/wiki/Transitive_dependency
[lingchi]: https://en.wikipedia.org/wiki/Lingchi
[deno]: https://deno.land/
[node-test]: https://nodejs.org/api/test.html
[tc39]: https://github.com/tc39/proposals
[npm-danprince]: https://www.npmjs.com/~danprince
[squatting]: https://docs.npmjs.com/policies/disputes#squatting
[growing-pains]: https://blog.appsignal.com/2020/05/14/javascript-growing-pains-from-0-to-13000-dependencies.html