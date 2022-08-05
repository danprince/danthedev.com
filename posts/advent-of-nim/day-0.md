---
title: Why Nim?
date: 2021-12-1
series: ./
cover:
  url: /covers/advent/2021/day-00.jpg
  alt: Nim's Crown
---

[Last year](https://adventofcode.com/2020) I used [Julia](https://julialang.org/) and thoroughly enjoyed it. It was the first year where I had enough motivation to keep solving puzzles [right the way through to Christmas Day](https://github.com/danprince/advent-of-code/tree/master/2020).

After having a hard time with Rust the year before that, I was keen to return to the systems programming space, but with a higher level language that trades some safety for better developer ergonomics. [Nim](https://nim-lang.org/) seemed like a good fit.

Here are the features that immediately stood out as interesting.

## Static Type System
Static type systems with good editor integration are invaluable when you're learning a new language and relying on intellisense and inline errors, rather than stack traces.

Nim's type system has a few nice extras.
- [Distinct types](https://nim-lang.org/docs/manual.html#types-distinct-type) for times when you want safe nominal aliases
- [Structural tuple types](https://nim-lang.org/docs/manual.html#types-tuples-and-object-types)
- An [Effect system](https://nim-lang.org/docs/manual.html#effect-system)
- [Static expression types](https://nim-lang.org/docs/manual.html#special-types-static-t)

## Indentation Based Syntax
I'm always a little bit skeptical about identation based languages, as I tend to find that it discourages you from writing large functions.

That's not necessarily a bad thing, but I'm not a fan of splitting functions for the sake of splitting functions. Sometimes there's a lot of logic that belongs together and breaking it up involves extra work modelling the domain in ways that can be passed around.

This syntax works best when the language is expressive enough that your implementations tend to be short.

## Macros / Templates
Like Julia, Nim has first class support for syntax tree based macros. These aren't features that I expect to use very often, but languages that support them will often provide much more expressive libraries. For Advent of Code this means that problem solving with [DSLs](https://en.wikipedia.org/wiki/Domain-specific_language) is not only possible, but will probably result in much simpler final solutions.

I'm also excited about the potential here for compile time programming reducing the amount of work that goes on when I'm ready to run my solutions. I had a surprising amount of fun optimising peformance and reducing allocations with Julia's [`@time` macro](https://docs.julialang.org/en/v1/base/base/#Base.@time) last year, and I'll be keen to see what tools Nim offers in this space.

As a side note, it's also interesting to see that Nim has a garbage collector (usually a no-no for systems languages) but that you can override it and manage memory manually if needs be.

## Overloading & Method Syntax
Nim's flavour of multiple dispatch looks like traditional function overloading and similarly to Julia, this significantly reduces the surface area of the standard library. Each data structure can overload a standard set of operations (including operators).

This also appears to be the main reason why imports go into the global namespace by default.

There's no such thing as method (in the traditional object-oriented-programming sense) in Nim. Instead, there's a [Uniform Function Call Syntax](https://nim-lang.org/docs/manual.html#procedures-method-call-syntax) that has the first parameter in the object position.

This allows you to chain calls without the need for a pipeline operator, whilst still being able to pass procedures around as first class citizens without needing to decouple them from objects (like you would in JavaScript).

## Standard Library
Stuff that immediately stands out as useful for Advent of Code:
- `std/strutils` (string utils — great for parsing inputs)
- `std/sets` (hash sets)
- `std/tables` (hash maps)
- `std/sequtils` (functional sequence operations)
- `std/deques` (double ended queue)
- `std/heapqueue` (binary heap / priority queue)
- `std/option` (maybe data type)
- `std/md5` (I still remember 2016...)

The learning curve doesn't look too steep and I'm looking forward to getting started.

