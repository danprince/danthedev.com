---
title: Dan Prince
layout: post.html
index: true
description: |
  Making things, breaking things, and trying to fix the things I've broken before someone finds out.
---

Making things, breaking things, and trying to fix the things I've broken before someone finds out.

{% assign posts = collections.post | reverse %}
{% assign series = collections.series | reverse %}

## Series

<ul>
  {%- for post in series -%}
    {%- if post.data.index -%}
      <li>
        <a href="{{ post.url }}">{{ post.data.series }}</a>
      </li>
    {%- endif -%}
  {%- endfor -%}
</ul>

## Posts

<ul>
  {%- for post in posts -%}
    {%- if post.data.series == nil -%}
      <li>
        <a href="{{ post.url }}">{{ post.data.title }}</a>
      </li>
    {%- endif -%}
  {%- endfor -%}
</ul>
