---
title: What Is That Text Editor?
---

I've spent thousands of hours editing text inside a terminal and more time than I am proud to admit, configuring Vim. Then [NeoVim](https://neovim.io/). Then across to [Doom Emacs](https://github.com/doomemacs/doomemacs), and back to Vim again. It was never a surprise when my development workflow raised eyebrows and someone asked "What is that text editor?".

My initial attempts to switch to VSCode were about as successful as [trying to build a castle on a swamp](https://quotegeek.com/quotes-from-movies/monty-python-and-the-holy-grai/2266/), but now I've been using it full time for over a year, and people still ask "What is that text editor?".

![VSCode without all the visual bells and whistles](/img/2023-02-05-08-52-31.png){.overblown}

VSCode may have something of a reputation for being a resource hungry, battery draining piece of software in a  why-would-you-implement-a-text-editor-inside-a-browser-inside-a-native-app kind of a way, but it also has the best out of the box experience for working with TypeScript, which is most of the work I do now.

If you open the files above with a fresh install of VSCode, you'll see a UI optimised for discovery. All possible features are turned on so that the first time user can find and understand them.

![](/img/2023-02-05-10-47-33.png){.overblown}

The visual war for your attention is tough, but as a design decision I think it helps flatten the learning curve. It's much easier to turn something you can see off, than to discover a feature you can't see. For some reason, not everyone wants to spend their evenings reading [`:help quickfix`](https://vimhelp.org/quickfix.txt.html).

Lots of people seem to get excited about emulating VSCode inside Vim, which is fine if you want to build your own editor from a small tower of plugins. There are impressive efforts like SpaceVim, AstroNvim, and Nvchad which manage this complexity as standalone projects. I say they're coming at the challenge from the wrong direction. Make VSCode work like Vim!

### Vim

On this noblest of quests, [VSCodeVim](https://github.com/VSCodeVim/Vim) is the main character. Editing text without modes and motions is like having to look at your keyboard to type. This extension implements a _good_ amount of Vim's keybindings and commands [^1]. I occasionally run into edge cases, but not often enough that I've ever considered [embedding Neovim inside VSCode](https://github.com/vscode-neovim/vscode-neovim) for accuracy _or_ performance.

### Theme

I prefer using a light editor theme, but I use adaptive dark mode in the mornings and evenings to reduce some strain on my eyes. I want my editor to change with the operating system. No manual restarts, or keyboard shortcuts please. [GitHub Theme](https://marketplace.visualstudio.com/items?itemName=GitHub.github-vscode-theme) has (subjectively) great dark and light themes.

```json
// settings.json
"workbench.colorTheme": "GitHub Dark Default",
"workbench.preferredLightColorTheme": "GitHub Light Default",
"workbench.preferredDarkColorTheme": "GitHub Dark Default",
"window.autoDetectColorScheme": true,
```

### Minimap

The worst offender for misallocated screen space is the [minimap](https://code.visualstudio.com/docs/getstarted/userinterface#_minimap). Who uses this? What do they use it for? I have no idea of the visual shape of my code, and seeing it in small doesn't help me to do anything.

```json
// settings.json
"editor.minimap.enabled": false,
```

### Activity Bar

I also hide the activity bar (the thing on the left that opens the file explorer and source control panels). The only things I use from sidebar are the extensions panel (which opens with <kbd>⌘ shift x</kbd></kbd>) and project wide search/replace (which open with <kbd>⌘ shift f</kbd> and <kbd>⌘ shift h</kbd>). If I used these more often, I'd probably give them dedicated normal mode bindings with my leader key.


```json
// settings.json
"workbench.activityBar.visible": false,
```

### Tabs
I don't use tabs.

```json
// settings.json
"workbench.editor.showTabs": false,
```

Tabs are an opt-in feature in Vim, that I never opted-in to. Instead, I prefer working with Vim's buffer model. Every file opens in a buffer that lives in memory. Vim can show the contents of a buffer in a split, but if you close that split, the buffer doesn't disappear.

Running the `:buffers` command will list the currently active buffers and you can use commands like `:b` to jump to a buffer by name or index. Commands like `:bnext` and `:bprev` navigate backwards and forwards through buffers. There's even extra fancy stuff like `:bufdo` for running a Vim command in parallel on every open buffer.

I haven't been able to emulate a proper buffer based workflow in VSCode, but for now I'm comfortable using a one-buffer-per-split model.

### Status Bar
Vim's default status bar doesn't even show up until you have multiple splits open. Here's the info it contains.

- The name of the file

There's a lot more going on in the status bar in VSCode.

- A remote host button
- The current branch
- A source control sync button
- Project wide errors and warnings
- Line and column number
- The indent settings
- The file's encoding
- The file's line endings
- The file's type
- A way to send feedback
- A notification center

Of course there's someone out there who _needs_ this stuff, but for me, most of this information is superfluous. I'm reminded of tmux/i3 configs with a current weather icon in the status bar. Try working near a window, or going outside once in a while!

I remove everything from this bar other than the line/column number.

### Line Numbers
Line numbers are one of the primary ways to interface with other people and compilers or stack traces.

Ideally, the compiler in question integrates with the editor to show inline errors. I use custom normal mode bindings (copied from [vim-unimpaired](https://github.com/tpope/vim-unimpaired)) to bounce backwards and forwards between "problems".

```json
// settings.json
"vim.normalModeKeyBindings": [
    {
        "before": ["]", "q"],
        "commands": ["editor.action.marker.nextInFiles"]
    },
    {
        "before": ["[", "q"],
        "commands": ["editor.action.marker.prevInFiles"]
    },
]
```

When it comes to following a stack trace, or navigating directly to specific line, I find it much easier to type `123G` than to use the mouse to scroll there.

Having the current selection visible in my status bar means I can always see the line _I'm_ on for casual reference, but most of the time if I'm sharing that information with someone else, I use an extension called ["Open in GitHub"](https://marketplace.visualstudio.com/items?itemName=sysoev.vscode-open-in-github) to open or copy a GitHub link to the file and selection that I have open.

I think line numbers are mostly a tool for mouse-heavy workflows. Vim doesn't enable them by default and neither do I. If you use a lot of vertical text motions, counting lines can be useful, but even then, you'll likely want relative line numbering.

### Navigating
Effective navigation is a critical part of managing inside a large codebase, and the combination of VSCode and Vim excels here.

VSCode has the semantic side of navigation covered.
- I use <kbd>⌘ shift p</kbd> (Go to file) when I roughly know the name of the file I want to visit.
- I use <kbd>⌘ shift o</kbd> (Go to symbol) when I want to jump to a specific symbol in the current file. In a language like TypeScript, this could be the name of a function, a type, a variable. In CSS it could be a specific selector. In a language like markdown, it might be a heading.
- I use <kbd>⌘ t</kbd> (Go to symbol in workspace) to go to straight to a symbol anywhere in the workspace. This works brilliantly when you want to visit a specific name, but have no idea which file it lives in.
- I use <kbd>gd</kbd> (Go to definition) all the time when moving between definitions and instances, especially in typed programming languages.

These commands play well with Vim's [jumplist](https://vimtricks.com/p/vim-jump-list/). <kbd>ctrl o</kbd> (jump backwards) and <kbd>ctrl i</kbd> (jump forwards) are probably my most used navigational keys. I often combine them with <kbd>gd</kbd> for exploration. I'll jump to a type from a variable, then to the type of one of those properties, then use the jumplist to unwind the stack back to the original file.

I occasionally still use <kbd>ctrl 6</kbd> to swap to the previous file, but more often I'll open both files in separate splits and hop from side to side instead.

With fuzzy finders for files and symbols, I don't find much need for [breadcrumbs](https://code.visualstudio.com/docs/editor/editingevolved#_breadcrumbs). Disabling them frees up space at the top of the screen.

```json
// settings.json
"breadcrumbs.enabled": false,
```

### File explorer
Sometimes navigation crosses into the unknown and becomes more about discovery. This might happen when you've forgotten the name of a file, or you're working in a new directory, without any intuition for the structure. These are the times where you need a file explorer.

Vim comes with a directory explorer called [Netrw](https://vimhelp.org/pi_netrw.txt.html) (comparable to [dired](https://www.gnu.org/software/emacs/manual/html_node/emacs/Dired.html) in Emacs). It opens its own buffer in the active split. ["Oil and vinegar"](http://vimcasts.org/blog/2013/01/oil-and-vinegar-split-windows-and-project-drawer/) is a classic read, which compares split explorers and project drawers. I was convinced a long time ago and I haven't looked back.

VSCode doesn't have anything like Netrw. I was also surprised to see that no-one had implemented it as an extension either. I decided to build it myself.

[Vsnetrw](https://github.com/danprince/vsnetrw) is the text-based split explorer that I made for VSCode. I use it extensively every time I use VSCode, making it my highest value personal project. It supports a subset of Netrw's features (the _net_ component is absent), but for navigating, creating, deleting, and renaming files, it's a joy to use.

### Version control
It's well established that [Magit](https://emacsair.me/2017/09/01/magit-walk-through/) is one of the "killer apps" for Emacs. I've even heard of Vim users who open Emacs purely to interact with Git. For a long time I used [vim-fugitive](https://github.com/tpope/vim-fugitive), and after spending a year in Emacs, the built-in VSCode source control panel just doesn't cut it.

Thankfully, for that, there's [Edamagit](https://github.com/kahole/edamagit), a Magit implementation for VSCode. A Git buffer is only ever a <kbd>&lt;leader&gt;gg</kbd> away.

![](/img/2023-02-06-13-08-54.png)

From this buffer, I can manage branches, stage changes, stash, tag, push, pull, cherry-pick, rebase, commit, and [lots more](https://github.com/kahole/edamagit#usage). Best of all, the entire UI is text based, so you can navigate through it using motions and patterns you use everywhere else.

It needs some [extra keybindings](https://github.com/kahole/edamagit#vim-support-vscodevim) to work well with VSCodeVim, and even then there are some conflicts, but this is the best version control workflow I've had outside of Emacs.

### Tmux
Whilst not a feature of Vim at all, Tmux has been an integral part of managing sessions and processes in my workflow for a long time, and switching to VSCode means the editor can't be a part of that session.

For some simple projects I've stopped using Tmux altogether, in favour of having a VSCode [task](https://code.visualstudio.com/docs/editor/tasks) that starts a given process.

For example, when I sat down to write this article, I pressed <kbd>⌘ shift p</kbd> (to bring up the command palette), then selected "Run task" and "npm: start" to start Eleventy's build process and server.

For more complex projects, I still use Tmux. For most of the projects at work, I'll be running a set of Docker containers, a server, a frontend build process, and at least one regular shell. You could run these tasks in separate VSCode terminals, but I like to be able to detach the session entirely, when I'm switching projects, without having multiple instances of VSCode open together.

### Spot the Difference
Let's open up the original session in Vim and see how close we managed to get.

![](/img/2023-02-05-22-50-00.png)

And here it is again in VSCode.

![](/img/2023-02-05-08-52-31.png)

Pretty good, right? It's not going to be for everyone, but I find that I'd much rather opt-in to distractions, than have them onscreen at all time.

### What Do I Prefer About VSCode?
No text editor is strictly better than any other, and there's a weird amount of energy wasted on tribal superiority that I don't want to contribute to. It all comes down to personal preferences and operational tradeoffs.

That said, there are some VSCode features that do not exist in Vim, or that have alternatives that work better for me.

- The command palette (<kbd>⌘ shift p</kbd>) is ideal for discovering features and running tasks that aren't frequent enough to justify a keyboard shortcut.
- Having a built-in fuzzy finder is a big deal. Emacs has projects like Helm, which the community builds around, but in Vim I've been through ctrlp.vim, fzf, telescope, and more. I think this is better as an editor feature.
- [Tasks](https://code.visualstudio.com/docs/editor/tasks) are like Vim's `:make` on steroids.
- The ecosystem lines up far better with the kind of work that I do (mostly web based), both in editor support and language specific extensions.
- TypeScript is better than Vimscript. If you've spent much time with Vim's scripting language, then this is self evident. That said, writing VSCode plugins with TypeScript is still a long way short of the warm fuzzy feeling you get using Emacs lisp.
- [Live Preview](https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server) is a great way to bring a browser view directly into the editor. This can be great for fast feedback cycles when writing text, or designing components.
- [Live Share](https://visualstudio.microsoft.com/services/live-share/) is incredible. Invite another VSCode user into your session or vice versa, where they can connect as a concurrent editor, from their own copy of VSCode, complete with their extensions and configurations.
- The workspace search and replace in VSCode is great. Even whilst I was struggling to switch to the editor full time, I would open up VSCode for search and replace tasks. Don't get me wrong, you can't beat `:%s/foo/bar/g` inside a buffer (I love that VSCodeVim has the incremental preview for this feature!) but this was always painful in Vim.
- Mixed language support generally seems to be better in VSCode. I can get JavaScript completions inside script tags. Snippets of SQL and GraphQL and CSS will lint and highlight correctly inside TypeScript.

### What Do I Miss From Vim?
- Speed. At least on an MBP with an M1, VSCode is not laggy, but it's also not playing in the same league as Vim. This makes complete sense as part of the tradeoffs of building a text editor with web technologies. I still use Vim for many one-off tasks if I need to quickly edit text outside of my current workspace. Sometimes, I even use Vim inside VSCode's terminal.
- My battery life. One of the biggest factors that delayed my transition to VSCode was the strain on my battery life. I indirectly mitigated this problem when I upgraded to a new Macbook, but reliably VSCode is one of the most energy hungry apps I run.
- The editor is not as reliable. The editor slows down over a long enough sessions, but its unclear whether this is a performance regression with VSCode, or whether this is an extension leaking memory. As of this morning, VSCodeVim's undo stack resets when you save a file [^2]. For a few weeks between releases <kbd>ctrl n</kbd> and <kbd>ctrl p</kbd> stopped navigating up and down in some lists. You do not run into these kinds of problems with Vim.
- `:help`. VSCode is undoubtedly friendlier than Vim, but the documentation is scattered and sometimes patchy. Being able to open detailed documentation for any feature by name, directly inside your text editor is something I miss.
- I wish I could use workspace search and replace entirely inside a text buffer, rather than having to open the sidebar for that functionality. I said that this was painful in Vim, but once you're through the awkward step of generating a quickfix list of search results with something like `:grep vim *.md` and `:cfdo s/vim/emacs/gc` the user experience for previewing and confirming those changes is great.
- Spellcheck. It's kind of incredible that Vim comes with a spellchecker and VSCode doesn't. There are extensions that provide one, but in my experience they're also slow and hungry, so I stopped using them. That's probably why you spotted some typos in this post.

### Farewell, Vim?
Vim isn't going anywhere for me. I use it on servers, I use it inside Docker containers and virtual machines, I use it for one off tasks when I can't justify starting a VSCode session.

At the moment, I'm happy in VSCode and nothing is pushing me towards changing. For all my complaints about Vimscript, I'm also not wildy excited about the current state of the Neovim ecosystem and its transition to Lua.

When you customize VSCode, you are _configuring_ an editor. JSON works fine for this. It's not perfect, but supporting comments gets it close enough. When you customize Neovim, you tend to be _building_ an editor. You're connecting and configuring plugins for package management, for LSP, for fuzzy finding, for searching, for snippets, for completions, for version control. I'm done with the "handcraft your own editor" thing.

At the same time, I'm not overly jazzed about the direction Vim itself is going with [vim9script](https://vimhelp.org/vim9.txt.html) either. Is it a better language than Vimscript? Yes. Was it necessary to implement a new programming language to achieve that? Probably not. Vim and Neovim seem destined to diverge.

Why do some programmers habitually configure and tweak their text editors? Well, the simple answer is that it's fun. I also need to enjoy editing text to program or write effectively. If my editor is distracting, or flaky, or inconsistent, then that can interrupt my thought process.

There are lots of other tweaks I made that aren't worth mentioning here, but you can find the entire [VSCode config](https://github.com/danprince/dotfiles/tree/main/vscode) in my [dotfiles repo](https://github.com/danprince/dotfiles).

[^1]: [VSCodeVim Roadmap](https://github.com/VSCodeVim/Vim/blob/master/ROADMAP.md)
[^2]: https://github.com/VSCodeVim/Vim/issues/8157
