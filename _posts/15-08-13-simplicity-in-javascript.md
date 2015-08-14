---
layout: post
title: Simplicity in Javascript
---

> Simplicity is hard work. But, there's a huge payoff. The person who has a genuinely simpler system - a system made out of genuinely simple parts, is going to be able to affect the greatest change with the least work. He's going to kick your ass.    
> 
> __Rich Hickey__ - [Simplicity Matters][0]

Simplicity is not a concept that's reserved for Clojure developers or pure functional programmers. We all get a shot at writing simple systems, no matter what language we're working in. Although, as Rich points out in that talk (_which is great by the way, go watch it_), simple is not the same as easy.

This post is going to try and define a set of rules that will help you write Javascript, that is genuinely simpler and will help others affect the greatest change with the least work.

The language has some great features for adding complexity to codebases and they are used liberally and enthusiastically by developers every single day. So much so that some of those ideas permeate through into the specification and bloat the language.

Some of those features help us get stuff done very quickly, but add mountains of technical debt for others to deal with in the future. Here's what I've learned in my lifetime of writing Javascript.

## Rules for Simple Javascript

### 1. Avoid Classical Inheritance
Javascript is flexible, in fact it's so flexible that we can implement classical inheritance, in terms of prototypal inheritance. Admittedly, this is pretty novel (try implementing Prototypal inheritance in Java as a comparison). However, just because you can do something, doesn't mean you should!

Classical inheritance has been widely used in Javascript to help developers coming from other languages make more sense of the object model. So much so, that the next version of the ECMA specification will include class literals that are syntatic sugar for prototypes. I'll have a rant about that another time...

Not only is the prototypal model _at least_ as powerful, we also have a fantastic object model. We can use it to represent all of our data, without the need for any higher abstractions.

We've always had problems with `new` and `this` in Javascript. Even if you're a developer who _'has never ever had issues, because you always use it sensibly'_, there's no denying the additional complexity when you consider these two examples.

{% highlight javascript %}
function Rectangle(x, y, w, h) {
  return {
    x: x,
    y: y,
    w: w,
    h: h
  };
}

var r = Rectangle(50, 50, 100, 100);
{% endhighlight %}

vs

{% highlight javascript %}
function Rectangle(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
}

var r = new Rectangle(50, 50, 100, 100);
{% endhighlight %}

On the surface these are fairly similar. The average developer knows that the value of `this` will be bound to a new object when the function is called with the `new` keyword.

There is already complexity that developers maintaining this code need to understand.

What happens if we call the function without `new`? Well, the value of `this` will be set to `window` (unless you're in strict mode) and you'll end up with 4 accidental global variables. Not only is this complex, but it's dangerous _and_ confusing.

There's a reason why large libraries and frameworks opt for these approaches:

{% highlight javascript %}
React.createClass({ });
// and
angular.module('', []);
{% endhighlight %}

Rather than these.
{% highlight javascript %}
new React.Class({ });
// and
new angular.Module('', []);
{% endhighlight %}

The more time you spend using interfaces that depend heavily on the context of `this` being correct, the more time you will spend tacking calls to `.bind(this)` onto the end of anonymous functions and having to log the value of this to the console just to check it is what you think it is.

Admittedly, some of these problems will be solved when the `=>` (fat arrow) operator has wide support because the RHS block uses the lexical value of this from the scope it was declared in. However, that is still added complexity.

Write functions that return objects, irrespective of the value of `this`. Code that relies on these classical inheritance oddities quickly introduces complexity to our systems. That's not to say that they are redundant, but in so many cases, our code can be improved if we use `Object.create` rather than `new` and object literals rather than `this`.

_For a fantastic read which compares Classical Inheritance in Javascript to the "fire from Dante's seventh circle of hell", go check out the wonderful [Pillars of Javascript][1] article._

### 2. Prefer Declarative Interfaces
Get this right and the people you work with, will be thanking you for a long time. Programming is about telling a computer what to do for given inputs. Unfortunately, the line between telling a computer what to do and telling a computer how to do it often gets blurred.

When we tell a computer how do something, we are specifying __imperative__ behaviour. At the lowest level, all programming is imperative and we use it to create abstractions that make it easier to manage. When we tell a computer _what_ to do (not how to do it) we call it __delcarative__ behaviour.

Which of the following hypothetical interfaces would you rather use?

#### Declarative
{% highlight javascript %}
Animate(document.body)
  .steps(100)
  .between({
    scrollTop: document.body.scrollTop
  })
  .and({
    scrollTop: document.body.scrollHeight
  })
  .play();
{% endhighlight %}

#### Imperative
{% highlight javascript %}
Animate(document.body, function(element) {
  if(element.scrollTop < element.scrollHeight) {
    element.scrollTop += 1;
  }

  return element.scrollTop > element.scrollHeight;
}, 100);
{% endhighlight %}

Chances are you picked declarative. The implementation may be more complex, but the interface is a lot simpler. It's easy to read as a result of being very declarative. It's very reusable and it can have other properties added to it trivially.

The imperative example has a function signature that could be hard to understand without checking some documentation or reading the source. Then once we're past that hurdle we have to do conditional logic and mathematical operations. More chances to make logical mistakes, syntax errors, or more likely in the case of Javascript, type errors. More complexity.

Many times, we've heard people say _"API design is not a science, it's an art."_ I'm going to counter this and say that we perceive API design to be an art because whilst also being technically sound, a good API can be both elegant and beautiful. I think that in this case, elegant and beautiful are both synonyms for __delcarative__.

A declarative API is one that will make the difference between your 

### 3. Minimize Side Effects

## Know How To Identify Complexity

The Fallacy of Simplicity: A simple system is simple to build.

[0]: https://www.youtube.com/watch?v=rI8tNMsozo0 Simplicity
[1]: https://medium.com/javascript-scene/the-two-pillars-of-javascript-ee6f3281e7f3 Two Pillars of Javascript
