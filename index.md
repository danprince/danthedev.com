---
title: Dan Prince
layout: post.html
index: true
description: |
  Making things, breaking things, and trying to fix the things I've broken before someone finds out.
---

Making things, breaking things, and trying to fix the things I've broken before someone finds out.

{% assign posts = collections.post | reverse %}

<ul>
{%- for post in posts -%}
<li>
  <a class="post-list-item" href="{{ post.url }}" >
    <span>{{ post.data.title }}</span>
    <time>{{ post.date | date: "%b %d, %y" }}</time>
  </a>
  </li>
{%- endfor -%}
</ul>
