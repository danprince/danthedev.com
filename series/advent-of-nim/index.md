---
index: true
title: Advent of Nim
permalink: /advent-of-nim/index.html
cover:
  url: /covers/advent/2021/day-00.jpg
  alt: Nim's Crown
---

Each year, I try to do [Advent of Code](https://adventofcode.com/) in a programming language that I'd like to know more about.

This year I'm using [Nim](https://nim-lang.org/).

{% assign posts = collections.series | filterBySeries: series | reverse %}

<ul>
  {%- for post in posts -%}
    <li>
      <a href="{{ post.url }}">{{ post.data.title }}</a>
    </li>
  {%- endfor -%}
</ul>
