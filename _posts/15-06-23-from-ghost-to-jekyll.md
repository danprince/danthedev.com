---
layout: post
title: From Ghost To Jekyll
---

My personal theory is that web developers are never truly happy with their own sites. There's a sense of an identity attachment that can be near impossible to shake. It becomes hard to look at it objectively and before long you don't have a product at all.

I was happy with the last version of danthedev for about 2 weeks, then I felt like it needed an overhaul. Over half a year later I'm writing another post on the new site. However, I'm not going to write about the revised visual identity (yet). I'm going to focus on the change in platform, from Ghost to Jekyll.

I've been a longterm advocate of the [Ghost](http://ghost.org) blogging platform. I admire the ethos behind Ghost. The _just a blog_ mantra has worked well for them and it seems to have been critical in their focused design of the authoring/publishing experience. Everything just works.

This site was kicked off with a minimalistic Ghost theme on my droplet, using nginx to reverse proxy to Ghost's node process. I kept everything up with [forever](http://github.com/foreverjs/forever). I'm no sysadmin, but this approach was working well for me.

Anyway, the blog ticked along with no problems for the best part of six months. After a few initial tweaks to the theme, I was able to leave it alone and work purely through Ghost's excellent web interface. Within a few months I had handful tweets pointing towards the site and other sites linking through to my articles on Vim.

As far as I'm aware there is no approved system for creating Ghost backups, but all the content is stored within a flat SQLite file in `yourghost/content/data`. A quick and easy hack would be to setup a daily cron job to tar/zip it and throw it onto another server with ssh/rsync/ftp ([although apparently this can cause problems](https://ghost.org/forum/using-ghost/1067-how-to-backup-ghost-content-data/)). If you host a Ghost blog and don't have a redundancy strategy in place, I would strongly consider setting something like that up.

You all see where this is going.

I navigated over to the blog about a month ago to find that the entire Ghost instance had been reset. Every post was gone, as was the theme. I was left staring at [Casper](https://github.com/TryGhost/Casper) with the "Your first post" sat on the front page. I performed a forensic postportem on the server and as far as I could tell, no one had accessed the server. I guess it's important to note that the instance hadn't been tampered with or sabotaged, it had been reset. No users in the table and one default post. The other node processes on the server were still running, including another Ghost instance.

I'm still not exactly sure what happened. If it was a security vulnerability, then it seems to be one that involves an manual reset, rather than a brute force attack on the admin interface, or my ssh certificates being compromised. Anyway, the droplet is now taken down and I have an image that can be fully analysed in a future post. For now, it's onwards and upwards with [Jekyll](http://jekyllrb.com/).

Jekyll is a static site generator that is built on top of a handful of conventions and a Ruby flavoured stack. Write your posts as markdown and your styles with SCSS. Grunt/gulp/whateverfile? Nope. Jekyll's gem handles watching compiling and serving with the `jekyll serve` command. Everything is flexible format. All entitities (posts, pages, etc) must contain a YAML block at the top, which can be populated with whatever you want. Layouts are written using the Liquid templating language, which so far seems intuitive. Jekyll ties all of the above together and deploys your site to a `_site` folder. All very good, but this combo alone is not a knockout.

The real power of a Jekyll blog is __Git__.

Git is the foundations that makes Jekyll a delight to work with. Revisions/backups? __Commits__. Draft staging? __Branches__. Multiple authors? __Collaborators__. Deployment? __GitHub pages__. I'm writing this post on a train, without internet connection and the battery is about to die? Of course, this isn't a problem; Git is distributed. I save this markdown file often to preview it. Every time I reach the end of a draft, I'll commit it to my drafts branch, then finally, when I reach civilisation I can merge `drafts` into `gh-pages` to deploy the site itself.

I still couldn't recommend Jekyll to a non-developer. The setup and authoring process would probably be fairly daunting still. However, I'm working on a pattern that would allow non-devs to host a Jekyll blog with GitHub and do all of their editing through [prose.io](http://prose.io/). However, if you are a developer who currently uses a stripped down Wordpress install or a Ghost instance, then I recommend trying it out.

