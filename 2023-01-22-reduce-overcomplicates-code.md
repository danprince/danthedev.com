---
title: Reduce Overcomplicates Code
layout: post.html
tags: post
---

The best aspects of functional programming are the ways in which it encourages simplicity, but JavaScript's functional [`reduce`][reduce] _usually_ just complicates your code.

```ts
robots.reduce((stats, robot) => ({
  ...stats,
  [robot.type]: (stats[robot.type] || 0) + 1,
}), {});
```

Reducing (or folding) is a technique for flattening an array with a binary function, sometimes known as a reducer. This classic example uses `reduce` to find the sum an array of numbers.

```ts
[1, 2, 4, 8, 16].reduce((a, b) => a + b);
```

It's terse, it avoids mutation, and using it makes you look smart. Let's look at some of the ways that reduce can trip you up in JavaScript.

### The Type Signature is Complex
It's not a coincidence that many programmers who are curious about functional programming get the hang of `map` and `filter` first.

```ts
[🟢, 🟢, 🟢].map(🟢 => 🔵) // => [🔵, 🔵, 🔵]
[🟢, 🟢, 🟢].filter(🟢 => ?) // => [🟢, 🟢]
```

The simplest version of reduce's type signature applies when the reducer operates on two values of the same type.

```ts
[🟢, 🟢, 🟢].reduce((🟢, 🟢) => 🟢) // => 🟢
[1, 2, 3].reduce((a, b) => a + b) // => 6
```

There's a more complex version when the 'reducer' produces a different type.

```ts
[🟢, 🟢, 🟢].reduce((🟣, 🟢) => 🟣, 🟣) // => 🟣
[1, 2, 3].reduce((a, b) => a + b, "") // => "123"
```

And both cases are further complicated when accounting for the special case behaviour for empty arrays.

```ts
[].reduce((🟢, 🟢) => 🟢) // TypeError: Reduce of empty array with no initial value
[].reduce((🟣, 🟢) => 🟣, 🟣) // => 🟣
```

Whether by design or by accident, this is JavaScript, and you can find reductions with even weirder type signatures.

```ts

[🟢, 🟢, 🔴].reduce((🟣, 🟢 | 🔴) => 🔵, 🟣) // => 🔵
```

Some of the worst offenders I have seen in the wild use the `index` argument to return a different value on the final call.

```ts
[🟢, 🟢, 🟢].reduce((🟣, 🟢, ⚪) => 🟣 | 🔵, 🟣) // => 🔵
```

When you choose a complex option in favour of a simple one, your code usually becomes less approachable.

### It Doesn't Fit In The Language
Most functions from the standard library can't be passed directly to reduce, because they're implemented as methods. For example, there's no `String.concat` function that would allow you to join an array of strings.

```js
["hello", "robot", "rules"].reduce(String.concat)
```

Instead, you have to create an intermediate function which does this job for you.

```js
["hello", "robot", "rules"].reduce((a, b) => a.concat(b))
```

This might not seem like a big deal, but most programming languages that offer `reduce` provide a standard library that keeps this in mind. In JavaScript it's often your job to wrap methods in small inline functions if you want to use reduce.

Even when it looks like the standard library wants to work with you, there's often a catch. `Object.assign` is a built-in function for merging objects, can we use it as a reducer?

```js
const head = { head: "default" };
const body = { body: "robot" };
const legs = { legs: "custom" };

const robot = [head, body, legs].reduce(Object.assign)
```

This looks reasonable, but it's hiding multiple bugs. Take a guess at the value of `robot` then run the code.

<details>
  <summary>Answer & Explanation</summary>

```js
{
  0: [recursive self reference],
  1: { body: "robot" },
  2: { legs: "custom" },
  body: "robot",
  head: "default",
  legs: "custom"
}
```

Firstly, [`Object.assign`][object assign] mutates its first argument. This means that we've accidentally mutated `head`. After this code runs, `head` and `robot` are the same object.

`Object.assign` also merges an arbitrary number of objects, which trips up `reduce`, because it passes four arguments to its callback function.

Take a look at a flattened equivalent of what reduce is doing.

```js
const parts = [head, body, legs];

let previousValue = head;
previousValue = Object.assign(previousValue, body, 0, parts);
previousValue = Object.assign(previousValue, legs, 1, parts);
const robot = previousValue;
```

</details>

You can read this as a criticism of `Object.assign`, but it's just another example of a time where the signature of `reduce` is orthogonal to the design of the rest of the language.

Inevitably, you end up having to create your own intermediate function, even though `Object.assign` looks like it fits the bill.

```js
const robot = [head, body, legs].reduce((a, b) => ({ ...a, ...b }));
```

Constantly wrapping the standard library is usually a sign that you're not programming in an idiomatic way.

When you use `reduce` it's your job as a programmer to remember to program defensively, avoiding mutable functions, and avoiding functions that take more than two arguments.

Not everyone recognises adding parameters as a semantic versioning breaking change, which can be dangerous for codebases passing those functions directly to `reduce`, which, as we've seen above, calls the callback with four arguments.

### It's Too Powerful
Programmers exploring a slightly more functional style often realise that `reduce` can return an array. This means that operations like `map` and `filter` can be expressed in terms of `reduce`.

```js
parts.map(part => part.type)
parts.reduce((types, part) => [...types, part.type], [])

parts.filter(part => part.price < 10)
parts.reduce((parts, part) => part.price < 10 ? [...parts, part] : parts)
```

In fact, almost every other array method can be re-implemented in terms of reduce.

Compared to `reduce`, `map` and `filter` have some clear constraints.

- They both return a new array.
- They both take a single item from the array as their first argument.
- `map` _cannot_ add or remove items from the array.
- `filter` _cannot_ add to or transform the items inside the array.

Well-defined constraints encourage simpler code. The lack of constraints for `reduce` makes it your job to moderate the resulting complexity.

_JavaScript will not prevent you from doing too much work in a single reducer._

## What To Use Instead?
Reduce has a place in JavaScript, but it isn't a method you should go out of your way to use, and in almost all cases, you can express the same operation with simpler constructs.

### Local Mutation
The vast majority of times that you see `reduce` in the wild, the code would be easier to follow as a `for` loop with some mutable variables.

```js
function count(items) {
  return items.reduce((counts, item) => {
    return {
      ...counts,
      [item]: (counts[item] || 0) + 1,
    };
  }, {});
}

// vs

function count(items) {
  let counts = {};

  for (let item of items) {
    counts[item] = (counts[item] || 0) + 1;
  }

  return counts;
}
```

Does it matter that the second function uses mutation to achieve the end result? Is it any less pure than using `reduce` if `reduce` [is implemented with local mutation](https://chromium.googlesource.com/v8/v8/+/e0c1ca5a302b0a6f771eabb2de1b66cc6e1f40f6/src/builtins/array-reduce.tq#90)?

> _If a tree falls in the woods, does it make a sound?_
>
> _If a pure function mutates some local data in order to produce an immutable return value, is that ok?_
>
> — [Transient Data Structures](https://clojure.org/reference/transients) in Clojure

You can still benefit from the high level benefits of side-effect free programming without introducing the low level noise that comes with reduce, when you accept local mutability as a natural part of writing idiomatic JavaScript.

### Extracting Reducers
I still think `reduce` can be an acceptable choice but only really when the reducer function makes sense in a standalone context.

Pull the callback out of the call and declare it as a standalone named function. Does it make sense? Could you call this function in other scenarios or was the type signature contrived to fit inside a call to `reduce`? If the isolated function makes sense, then keep it extracted as you probably have a valid case for calling `reduce`.

The most common example of `reduce` is finding the sum of an array of numbers.

```js
let add = (x, y) => x + y;

[1, 2, 3].reduce(add);
```

The isolated version of `add` is a perfectly valid (if a little simplistic) function that could be tested and used outside of the context of reductions.

There are languages where folding is a natural part of programming and I'm not against the concept in general, I just think that reducing in JavaScript tends to encourage complexity. Join me again next time for another rant I should probably start calling "just use a for loop".

[reduce]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
[map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
[filter]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
[tco]: https://en.wikipedia.org/wiki/Tail_call
[es5]: https://262.ecma-international.org/5.1/
[freeze]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
[object assign]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
