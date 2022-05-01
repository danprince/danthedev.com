---
title: Stop Using forEach!
cover:
  title: Next time, I'll use a for loop...
  alt: A kraken destroys a ship.
  url: /covers/kraken-foreach.png
description: >
  The deepest circles of JavaScript hell are reserved for people who use forEach.
---

The deepest circles of JavaScript hell are reserved for people that use [`forEach`][for-each].

```js
krakenTentacles.forEach(tentacle => tentacle.mutate()); // uh-oh!
```

To understand why this cursed method exists, we need to look at the original ways to loop over an array.

The safe option was the `for` loop.

```js
for (var i = 0; i < krakenTentacles.length; i++) {
  krakenTentacles[i].mutate();
}
```

And the other was the `for..in` loop.

```js
for (var i in krakenTentacles) {
  krakenTentacles[i].mutate();
}
```

It may look friendlier but `for..in` has some big problems.

- [It doesn't always iterate over arrays in order](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in#array_iteration_and_for...in)
- [It iterates over all enumerable properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in#iterating_over_own_properties_only) (including inherited ones)
- The index variable is a string, not a number.

At the time, `var` was the only way to define a local variable. This meant that both loop's variables would be visible outside of the loop block, which caused all kinds of bugs.

And lo' and behold, the fifth edition of ECMAScript appeared with a method for safely iterating over arrays: `forEach`!

- Guaranteed to iterate in order
- Binds the index and value variables in one go
- The index variable is a number (not a string)
- The bound variables don't leak out of the function

```js
krakenTentacles.forEach(function(tentacle, i) {
  console.log(i, number);
});
```

This seems like a reasonable way to solve some legitimate problems without changing the grammar of the language.

However... JavaScript has improved a lot since `forEach` first appeared. Most of these problems have better solutions, and the language has grown in ways that `forEach` doesn't understand.

`forEach` doesn't cut it any more, and you shouldn't be using it in new code!

## It's not a loop!
You can't `return` a value early.

```js/3
function findLoadedCannon(cannons) {
  cannons.forEach(cannon => {
    if (cannon.isLoaded()) {
      return cannon; // Has no effect on the outer function.
    }
  });
}
```

You can't [`break`][break] or [`continue`][continue].

```js/2
escapeRoutes.forEach(escapeRoute => {
  if (escapeRoute.isOpen()) {
    break; // SyntaxError
  }
});
```

You can't use [`await`][await] or [`yield`][yield].

```js/2
async function prayForDeliverance(gods) {
  gods.forEach(god => {
    let answer = await prayTo(god); // SyntaxError
    callOut(answer);
  });
}
```

`forEach` regularly causes confusion in asynchronous code, where it looks like you can solve the problem by making the callback function `async` too.

```js
async function prayForDeliverance(gods) {
  let answers = [];
  await gods.forEach(async god => {
    let answer = await prayTo(god);
    answers.push(answer);
  });
  return answers;
}
```

`forEach` quietly ignores the `async` nature of the callback, and `await` quietly ignores the `undefined` that `forEach` returns.

`prayForDeliverance` will return a promise that always resolves to an empty array.

Then at _some point in the future_, the `fetch` calls start to resolve in an unpredictable order, and that array starts to mutate underneath you.

You're dealing with race conditions, asynchronous mutations, and unhandled promise exceptions in this little function, all because you used `forEach`.

## It Only Works With Arrays
You can't use `forEach` to iterate over a `string`.

```js
"shipwreck".forEach();
// undefined is not a function
```

Or a [`Map`][map] or a [`Set`][set].

```js
new Map([[3, "buckets"], [2, "ropes"]]).forEach();
// undefined is not a function

new Set(["spyglass", "compass", "rum"]).forEach();
// undefined is not a function
```

Or any other third party data structure that implements the [iterable protocol][iterable].

```js/4
import { PegLegTree } from "@pirates/trees";

new PegLegTree(23, 54, 64, 12).forEach();
// Only works if `PegLegTree` has implemented a `forEach` method.
```

<details>
  <summary>
  <code>forEach</code> actually tried to solve this problem before iterables existed!
  </summary>

When `forEach` appeared, arrays were not the only thing people needed iterate over. The language designers knew this, and they included the following note [in the specification](https://www.ecma-international.org/wp-content/uploads/ECMA-262_5th_edition_december_2009.pdf):

> _The `forEach` function is intentionally generic; it does not require that its __this__ value be an Array object._
>
> _Therefore it can be transferred to other kinds of objects for use as a method. Whether the `forEach` function can be applied successfully to a host object is implementation-dependent._

Here's an example of "transferring" `forEach` to a string.

```js
Array.prototype.forEach.call("shipwreck", char => {
  console.log(char);
});
```

It works (in an implementation-dependent sense), but it's not pleasant. It's not obvious why the prototypal inheritance model is leaking out into the code.

Behind the scenes it is checking for a numeric `length` property, then attempting to iterate over the indexes.

This means that you get some interesting behaviours when you call `forEach` on an object that's pretending to be an array.

```js
// Don't run this unless you want to crash your browser
Array.prototype.forEach.call({ length: Infinity }, console.log);
```

</details>

## Save yourselves!

`forEach` is a sinking ship that we need to abandon. Thankfully, [`for..of`][for-of] is our lifeboat!

```js
for (let tentacle of krakenTentacles) {
  tentacle.mutate();
}
```

You _can_ `return` from inside.

```js/3
function findLoadedCannon(cannons) {
  for (let cannon of cannons) {
    if (cannon.isLoaded()) {
      return cannon;
    }
  });
}
```

You _can_ [`break`][break] and [`continue`][continue].

```js/2
for (let escapeRoute of escapeRoutes) {
  if (escapeRoute.isOpen()) {
    break;
  }
});
```

You _can_ use [`await`][await] and [`yield`][yield].

```js/2
async function prayForDeliverance(gods) {
  for (let god of gods) {
    let answer = await prayTo(god);
    callOut(answer);
  }
}
```

The `for..of` loop works with any object that implements the [Iterable][iterable] protocol (including `Array`, `String`, `Map` and `Set`).

It also works with `let` and `const` to create [block scoped][block scoping] variables that are only visible inside the loop.

You can fall back to a `for` loop if you need the index variable too.

`forEach` was the short-term fix, but `for..of` is the long-term solution!

[for-each]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
[array-methods]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[reflection]: https://en.wikipedia.org/wiki/Reflective_programming
[break]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/break
[continue]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/continue
[await]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await
[yield]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield
[for-of]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of
[iterable]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
[map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[set]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
[nodelist]: https://developer.mozilla.org/en-US/docs/Web/API/NodeList
[typed-arrays]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays
[block scoping]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#scoping_rules