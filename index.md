---
title: Dan Prince
layout: default.html
nodate: true
---

I’m a programmer from North Wales, currently taking a year out from [Kumu][kumu] to travel the world.

Making things, breaking things, or trying to fix the things I’ve broken before someone finds out.

I also like climbing rocks, playing guitar, and finding food in the great outdoors.

{% assign posts = collections.post | reverse %}

<ul>
  {% for post in posts %}
  <li>
    <time datetime={{ post.date }}>{{ post.date | date: "%b %e, %Y"  }}</time>
    <a href="{{ post.url }}">{{ post.data.title }}</a>
  </li>
  {% endfor %}
</ul>

[kumu]: https://kumu.io
