---
title: JavaScript's Dependency Problem
---

With nearly two million packages, JavaScript's de facto package registry is already an order of magnitude larger than equivalent registries for other programming languages.

![](/package-stats.png)

JavaScript is probably a more popular programming language, but we're still way off the normal scale here. Why is that? And does it matter?

### Standard Library
JavaScript has a taken a unique evolutionary path because of its role on the web. The commitment to backwards compatibility is maintained by a committee who try to ensure that the growth of the language is indefinitely sustainable.

We see a modest handful of extensions to the language specification each year. At this velocity, it becomes hard for JavaScript to ever seriously compete against general purpose programming languages with comprehensive standard libraries.

It doesn't help that both Node.js and the web have 'mid-level' standard libraries, either. Too low-level to use directly in applications, but high-level enough that the average developer can spot opportunities for abstractions.

These gaps created a culture of using libraries to solve all but the simplest problems. If we want to build user interfaces, we reach for React, not `document.createElement`. If we want to build servers, we reach for Express, not `http.createServer`. Even before npm existed, working directly with the DOM was uncommon. Everyone reached for jQuery.

When we learn that libraries are the way to solve problems, then we solve novel problems (real and imagined) with novel libraries. More programmers, more problems. More problems, more packages.

### External Tools
A majority of the dependencies for modern frontend development are only used during development. This is largely because JavaScript has no official distribution, and the popular runtimes don't include tools for managing codebases.

Instead, we reach for libraries. Projects often begin with the installation of a formatter, a linter, a bundler, a type checker, a minifier, a testing framework, or some combination of the above.

These tools are developed in relative isolation. The formatter knows nothing about the linter, the linter knows nothing about the type checker, and so on. These tools need to be wired together with plugins and configuration files. This creates another explosion of supporting packages.

### Tribalism 
As the [lingua franca of the web][lingua-franca], people from all kinds of programming backgrounds use JavaScript at some point in their careers.

This melting pot of ideas, opinions, and subcultures helps the language learn from the successes and failures of other languages. It also fragments the identity of the language, the idioms from which people learn, and the ecosystem as a whole.

Almost every popular package that solves a problem with object oriented programming, has an alternative that provides the same functionality with a pure functional flavour. For each package which embraces the dynamic aspects of the language, there's another which constrains them with static types. Every school of thought believes that their way is best, and they all rewrite existing libraries to prove it.

These tribal rivalries also bleed into stylistic preferences for frameworks. React, Vue, Svelte, Angular, Web Components and more. These ecosystems tend to solve the same kinds of problems in parallel, each creating a unique package ecosystem.

Even language features have proven to be controversial enough to create their own divisions. It's easy to forget how many libraries were duplicated whilst the community took a few years to decide that promises were probably better than callbacks.

### Small Modules
Many JavaScript applications become interactive after downloading the source code. As a rule of thumb, shipping less code makes for a better user experience. That created another class of package duplication.

JavaScript suffers from an above-average problem with technical debt. Partly because the dynamic nature of the language allows us to write code in unsustainable ways, and partly because the popularity of the language creates demand for adjacent problem solutions.

Maturing packages tend to lose velocity as they grow in size, and developers begin to search for alternatives that solve a vertical slice of the problem with significantly fewer lines of code.

Eventually some of the alternatives mature and the cycle repeats itself. It only takes a few generations of splitting to arrive at atomic packages like `left-pad` and `is-even`.

For the authors, these tiny modules are easier to reason about in isolation, which makes them easier to test, easier to optimise, and easier to version. Consumers can install the exact set of tiny packages they need without worrying about whether their toolchain will "tree shake" everything correctly.

The dream is a lego brick utopia. Each package solves a single problem, and they all slot together neatly [to build a lego castle][small-modules].

Lego works well because the bricks are standardised. Every lego set uses studs with equivalent size and spacing, allowing the blocks to fit together consistently. But we're programmers. We all have our own ideas about the tradeoffs that packages should make, and these opinions almost always bleed into the public interfaces of packages.

Some package authors despise object oriented programming, some want to express everything with chained method calls, others strive for the kinds of performance you can only achieve through mutable programming, whilst others are so horrified by mutability that they work with third party data structures that need to be serialised back and forth to be used by normal code. Often these "bricks" don't fit together without some glue.

There's a reason that toy shops don't sell lego bricks individually. Small modules dilute the coherence of the ecosystem as a whole.

### Inexperienced Developers
For better or worse, new programmers often start with JavaScript. It's a deceptively simple language, and the permissive design means we can become productive relatively quickly. Throughout their learning experiences, many arrive at [false summits][false-peaks] where they mistakenly assume they have mastered the language.

These inexperienced but overconfident developers tend to discover that it is harder to make a meaningful contribution to an existing package than it is to create a simpler version from scratch.

Recreating existing software is a wonderful way to learn. However, npm set the bar for publishing a package so low that these learning exercises have significantly diluted the value of the average package in the registry.

There are hundreds of thousands of unused and unmaintained packages by developers who thought they were making a meaningful contribution to the ecosystem by publishing  half-baked thought experiments with catchy names and unusually polished logos.

I'm as guilty as anyone else. [My own npm profile][npm-danprince] lists some shamefully empty packages that my younger self thought would grow into popular and useful open source projects.

Not everyone there has misplaced their confidence though; some just want to look better on paper, some don't realise that they're solving a solved problem, and others are so afraid of repeating themselves that they package up and publish every tiny abstraction they ever stumble upon.

### Squatters
The name of a package is a critical part of its identity. It's the part that users have to type out every time they install it. Short names are faster to type, and catchy names are easier to remember. Despite squatting being a [violation of npm's terms of use][squatting] many package names are registered prematurely and never used.

The darker side of this problem is known as [typosquatting][typosquatting] and it involves registering malicious packages with deliberately similar names to popular ones. After you hit `npm install` your system is at the mercy of the `postinstall` scripts of whichever package name you typed. On a good day a misspelling results in a registry miss with a friendly warning. On a bad day, you [send your production environment variables to a bad actor][crossenv-malware].

npm has [naming rules][new-rules] that prevent some common techniques for typosquatting, but while humans have fat-fingers and slow response times, we'll keep making mistakes, and bad actors will capitalise on them because it is laughably easy for them to publish packages on npm.

## Why Does It Matter?
Anyone who's worked in a large JavaScript project knows that the `node_modules` folder is a wild place. Codebases have hundreds, if not [thousands of transitive dependencies][growing-pains] and trying to understand or audit them all is an exercise in futility.

The quality dilution of npm should matter to all of us, because understanding the code that we add to our projects is important.

We should know whether we just installed something that's [going to try to steal crypto from our users][copay]. We should know whether the package is actively maintained, or whether it's going to be our job to make sure that the code is still secure. 

We don't need to understand low-level implementation details, but we should at least have a high level of understanding of how a package works, unless we want to be caught with our hands in our pockets when something goes wrong.

It's currently hard to install packages with confidence that the code is correct, that the code is maintained, and that the code is not malicious. There no real guarantee that semantic versioning is applied correctly and that breaking changes will be documented.

## Where Do We Go From Here?
Might might be too late for npm to ever become a high quality package registry, but there's still plenty that we can do to improve the current story.

We can support the [TC39 proposals][tc39] that turn JavaScript into a better general purpose programming language.

We can encourage the trend towards integrated tools. Node's move towards a [standard test runner][node-test] is a step in the right direction. The [fewer tools we need to install to be productive, the better][without-tools].

We can prefer lego sets to individual lego bricks. Use the standard library when possible. Don't use one-line packages when the equivalent method exists in `lodash`. The current generation of build tools are great at removing unused code from our bundles, and unifying around coherent packages gives the whole community a shared frame of reference.

We can try to create a culture of contribution. It's easy to shame mature packages for having clunky codebases and huge bundle sizes, but it's better to join the conversation to see what is being done and how we can help. When popular packages are improved rather than abandoned, everyone wins.

We can make a habit of picking one package with many contributors, rather than many packages with one contributor. We can make a habit of picking the package with zero dependencies.

We can reduce tribalism by being open to solutions written in different programming styles, even when that means sacrificing some purity in our own projects.

We can take more responsibility when deciding to publish packages. Is the problem that we're solving real or imagined? Have we shared the codebase with other developers to find out whether the solution is generally applicable? Are the appropriate tests and documentation in place? Are we committed to maintaining the codebase, or is it just a completed weekend project?

If we were designing a hypothetical new package registry for JavaScript, we might choose to reserve the top level namespace for packages that were manually verified to be high quality and important. Anyone would be able to publish packages into their own scope (`@danprince/foo`), but to be published without a scope (`foo`) the package would need to reach a high integrity score—some combination of downloads, contributors, and published versions—and would need to undergo a manual quality and security review.

These unscoped packages would be blessed as part of the ecosystem, a mark of quality which would help us all navigate the registry. If we can have a committee that decides on language features, then why shouldn't we aspire to have a similar process for blessing packages?

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
[copay]: https://blog.npmjs.org/post/180565383195/details-about-the-event-stream-incident
[without-tools]: /web-dev-without-tools/
