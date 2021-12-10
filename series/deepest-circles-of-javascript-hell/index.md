---
index: true
title: The Deepest Circles of JavaScript Hell
permalink: /deepest-circles-of-javascript-hell/index.html
---

Forget betrayers and mutineers, and worry about your own fortunes. An eternity of damnation awaits the programmers who pick complex code when simple would do.

The deepest circles of JavaScript hell are reserved for...

{% assign posts = collections.series | filterBySeries: series | reverse %}

<ol>
  {%- for post in posts -%}
    <li>
      <a href="{{ post.url }}">{{ post.data.phrasing }}</a>
    </li>
  {%- endfor -%}
</ol>

_This is a satirical series on patterns and practices that I don't like. Disagree with something here? Let me know on [Twitter](https://twitter.com/_danprince)._
