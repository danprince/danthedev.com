---
title: Dan Prince
layout: post.html
index: true
description: |
  Making things, breaking things, and trying to fix the things I've broken before someone finds out.
---

{{ description }}

{% assign posts = collections.post | reverse %}

{%- for post in posts -%}
  <div class="post-list-item">
    <a href="{{ post.url }}" >
      <time>{{ post.date | date: "%b %d, %y" }}</time>
      <span>{{ post.data.title }}</span>
    </a>
  </div>
{%- endfor -%}
