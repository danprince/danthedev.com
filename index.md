---
title: Dan Prince
layout: post.html
index: true
description: |
  Making things, breaking things, and trying to fix the things I've broken before someone finds out.
---

Making things, breaking things, and trying to fix the things I've broken before someone finds out.

{% assign posts = collections.post | reverse %}

{%- for post in posts -%}
  <a class="post-list-item" href="{{ post.url }}" >
    <time>{{ post.date | date: "%b %d, %y" }}</time>
    <span>{{ post.data.title }}</span>
  </a>
{%- endfor -%}
