---
title: Dan Prince
layout: default.html
nodate: true
---

I’m a programmer from [North Wales][north-wales-map], currently travelling the world, on a year out from [Kumu][kumu].

Making things, breaking things, and trying to fix the things I’ve broken before someone finds out.

{% assign posts = collections.post | reverse %}

<ul>
  {%- for post in posts -%}
    <li>
      <time datetime={{ post.date | date: "%Y-%m-%d" }}>{{ post.date | date: "%b%e, %Y" }}</time> - 
      <a href="{{ post.url }}">{{ post.data.title }}</a>
    </li>
  {%- endfor -%}
</ul>

[kumu]: https://kumu.io
[north-wales-map]: https://www.google.co.uk/maps/@53.0850005,-4.6192708,9.3z
