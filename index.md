---
title: Dan the Dev
layout: page.html
index: true
eleventyExcludeFromCollections: true
---

<header>
  <h1>Dan the Dev</h1>
  <p>Making things, breaking things, and trying to fix the things I've broken before someone finds out.</p>
</header>

<ul>
{%- for post in collections.all reversed -%}
  <li>
    <time>{{ post.date | date: "%b %d, %y" }}</time>
    <a href="{{ post.url }}">{{ post.data.title }}</a>
  </li>
{%- endfor -%}
</ul>
