---
layout: default.html
nodate: true
title: Dan Prince
---

Making things, breaking things, and trying to fix the things I’ve broken before someone finds out.

{% assign posts = collections.post | reverse %}

<ul>
  {%- for post in posts -%}
    <li>
      <a href="{{ post.url }}">{{ post.data.title }}</a>
    </li>
  {%- endfor -%}
</ul>

[kumu]: https://kumu.io
