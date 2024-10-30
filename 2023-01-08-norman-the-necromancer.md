---
title: Norman the Necromancer
description: A post-mortem of a necromantic action game.
layout: post.html
---

Most years I take part in [JS13K](https://js13kgames.com/), a month-long challenge to build a game for the web that must not exceed 13KB.

Most engines, fonts, textures, and audio samples will immediately blow the entire budget. Almost everyone works from scratch, relying on low level browser APIs and creativity to create the digital equivalent of a board game that fits in a matchbox.

When ["DEATH"](https://medium.com/js13kgames/js13kgames-2022-has-started-73a7bd31721b) was announced this year's theme, I resurrected an idea from a note and mockup that I made a few years ago.

> &ldquo;Play as an outcast necromancer trying to learn to reanimate corpses whilst being hunted by the inhabitants of the local village&rdquo;.
>
> ![An early mockup of how the game might look](/images/2023-01-03-22-48-04.png)

This iteration of the jam was the first time I actually finished and submitted a game. I want to look back at what worked, what didn't, and what I learned from building ["Norman the Necromancer"](https://js13kgames.com/games/norman-the-necromancer/index.html).

## What Worked Well?
I feel a bit uncomfortable patting myself on the back and saying "well done", but there were  positive aspects of the game and the development process that will influence the way I approach building small games in the future. Hopefully some of that can be useful to you too.

### 1. Visuals
Visuals are arguably the hardest part of making a game this small. For JS13K I usually generate my graphics with code, but this year I was resolute about using pixel art and managed to fit 83 sprites and a 96 character font into a 160x70 sprite sheet.

![](/images/2023-01-04-22-48-38.png)

I draw with a program called [Aseprite](https://www.aseprite.org/) and the blue rectangles are [slices](https://www.aseprite.org/docs/slices/) that define named sprites. I export the bounds of each sprite to a [JSON file](https://github.com/danprince/norman-the-necromancer/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/sprites.json) so that I can refer to those sprites by name. TypeScript's [`resolveJsonModule` option](https://www.typescriptlang.org/tsconfig#resolveJsonModule) ensures that there's a compile  error if anything goes out of sync.

It might seem odd to include a font, but it's almost impossible to render conventional text at this resolution without anti-aliasing creating a blurry mess. You _can_ render text above the canvas with HTML and a web font, but that ruins the low resolution aesthetic. I also happen to like making fonts and text renderers!

Tweens and particle effects are both classic ["juice"](https://www.youtube.com/watch?v=Fy0aCDmgnxg) techniques that hide the static nature of these sprites. Instead of using animation frames for walk cycles, objects hop with a sinusoidal tween. For almost everything else, I used particle emitters and burst them to show that something happened.

<div style="display: flex; justify-content: space-around;">
<img src="/images/norman-particles-bones.gif" alt="" />
<img src="/images/norman-particles-monk.gif"  alt="" />
<img src="/images/norman-particles-heal.gif"  alt="" />
</div>

The rest of the aesthetics are minimal, partly to stay within the budget and partly to keep the focus on the foreground as much as possible. The hallway in which the game takes place is barely visible pattern of repeating tiles, and the UI elements try not to compete for attention by staying well away from the action.

### 2. Spells
Despite the curious necromancer narrative, this game largely ended up being about magic and spells. Norman ended up as more of a spell-slinger than a reclusive scientist.

![](/images/norman-spells.gif)

The basic casting mechanics are very basic. The player chooses an angle and shoots a gravity-affected projectile at a fixed velocity. Not a huge amount of fun, but the interesting stuff happens when you use souls to perform rituals at the end of each level. Many of these rituals alter Norman's spellcasting.

For example, "Drunkard" makes the spells stronger, but messes with your aim. "Weightless" negates the effects of gravity. "Bleed" adds a bleeding status to anything your spells hit. "Hunter" adds a guidance system to projectiles. And on and on. 13 of the game's 20 rituals focus on spellcasting. The goal was to have a large enough variety of rituals that every play through would feel different. That didn't quite happen, but more on that later!

[Noita](https://noitagame.com/)'s [synergistic collection of spells](https://noita.wiki.gg/wiki/Spells) were a major influence on the game. There's also some unintentional visual crossover, with the low resolution particle effects. I don't think there's any way to avoid this when you're using 1x1 pixel particles.

### 3. Objects
Almost everything you see in the foreground of this game is a [`GameObject`](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/game.ts#L29) but you won't find `extends GameObject` anywhere in the codebase. This flat architecture has two separate sources of inspiration. The first is the codebase for [Rift Wizard](https://store.steampowered.com/app/1271280/Rift_Wizard/) (I ended up diving into the source whilst trying to get it to run on MacOS one rainy weekend) where all units are defined inside factory functions. The second is the message about classes working really well for shallow but wide inheritance hierarchies, from ["Is There More to Game Architecture than ECS?"](https://www.youtube.com/watch?v=JxI3Eu5DPwE).

Here's the code for a villager.

```ts
export function Villager() {
  let unit = new GameObject();
  unit.sprite = randomElement([
    sprites.villager_1,
    sprites.villager_2,
    sprites.villager_3,
    sprites.villager_4,
  ]);
  unit.friction = 0.8;
  unit.mass = 75;
  unit.x = game.stage.width;
  unit.tags = LIVING | MOBILE;
  unit.hp = unit.maxHp = 1;
  unit.updateSpeed = 600;
  unit.addBehaviour(new March(unit, -16));
  unit.corpseChance = 0.75;
  unit.souls = 5;
  return unit;
}
```

Units can base themselves on other units. For example, the piper starts as a villager, but then gets a different sprite, some stat tweaks, and a special behaviour.

```ts
export function Piper() {
  let unit = Villager();
  unit.sprite = sprites.piper;
  unit.updateSpeed = 500;
  unit.hp = unit.maxHp = 15;
  unit.addBehaviour(new Summon(unit, Rat, 2000));
  unit.souls = 100;
  return unit;
}
```

This is still a form of single inheritance, but it's a charmingly simple version of it.

I use the same pattern for spells. These are the projectiles that are cast by the default spell.

```ts
export function Spell() {
  let object = new GameObject();
  object.sprite = sprites.p_green_skull;
  object.tags = SPELL;
  object.collisionMask = MOBILE | LIVING;
  object.mass = 100;
  object.emitter = fx.trail();
  object.friction = 0.1;
  object.despawnOnCollision = true;
  object.despawnOnBounce = true;
  object.addBehaviour(new Damaging(object));
  return object;
}
```

All objects have tags and collision masks which define the possible set of collisions with a bitmask. For example, all villagers have the `MOBILE` tag, and all spells include `MOBILE` as part of their collision mask. At some point in the game, you might find the "Seer" ritual which allows spells to pass through your skeletons, and the implementation is as simple as tweaking the collision mask for each spell that is cast.

```ts
export let Seer: Ritual = {
  tags: NONE,
  name: "Seer",
  description: "Spells pass through the dead",
  onCast(spell) {
    spell.collisionMask = LIVING;
  }
};
```

These game objects and patterns ended up being flexible enough that they never really got in the way of inspiration whilst programming. They still suffer from ["the diamond problem"](https://en.wikipedia.org/wiki/Multiple_inheritance#The_diamond_problem) and might struggle to scale up for games with lots of hierarchical complexity.

### 4. Behaviours
One of the ways I kept the `GameObject` class small was to offload lots of complexity out to _systems_ (for example [rendering](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/renderer.ts#L25) and [physics](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/game.ts#L367)) and _behaviours_, which might be a less obvious abstraction.

Each game object has a list of behaviours, and these behaviours respond to the various events that occur during gameplay. `Behaviour` itself is quite a simple class.

```ts
export class Behaviour {
  constructor(public object: GameObject) {}
  turns = 1;
  timer = 0;
  sprite: Sprite | undefined;
  onAdded() {}
  onRemoved() {}
  onUpdate(): boolean | void {}
  onBounce() {}
  onDamage(damage: Damage) {}
  onDeath(death: Death) {}
  onFrame(dt: number) {}
  onCollision(target: GameObject) {}
}
```

Each object has an internal update speed to create variance between the different types of enemies, and in turn, each behaviour has a `turns` timer. When the parent object updates, `timer` goes up, and when `timer > turns` we call the `onUpdate` method. The other events are more intuitive.

This is where things start to look a little bit more like [composition (rather than inheritance)](https://en.wikipedia.org/wiki/Composition_over_inheritance) but this isn't a novel pattern. Many game engines have stabilised on similar architectures where you add scripts, or handlers, or logic nodes to objects instead of extending them. I just don't feel like I see it in JavaScript very often, so it's worth mentioning here.

As a simple example, here's the implementation for the invulnerable behaviour, which prevents certain enemies from taking damage in some scenarios.

```ts
export class Invulnerable extends Behaviour {
  sprite = sprites.status_shielded;

  onDamage(damage: Dmg): void {
    if (damage.amount > 0) damage.amount = 0;
  }
}
```

[`March`](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/behaviours.ts#L34) makes objects hop along the corridor in a given direction (useful for skeletons and villagers). [`DespawnTimer`](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/behaviours.ts#L20) despawns an object (surprise) after a certain amount of time has elapsed (useful for preventing spells from bouncing indefinitely).

Poke around in the codebase, you'll also see quite a few anonymous behaviours. The monk heals once every 5 turns. If there were lots of healer objects in the game, or this behaviour tracked some internal state, then it would probably become a reusable behaviour, but for now, it's defined in the function that creates monks.

```ts/7-21
export function Monk() {
  let unit = Villager();
  unit.sprite = sprites.monk;
  unit.updateSpeed = 600;
  unit.hp = unit.maxHp = 3;
  unit.souls = 10;

  let heal = new Behaviour(unit);
  heal.turns = 5;
  heal.onUpdate = () => {
    for (let object of game.objects) {
      if (object.is(LIVING)) {
        Damage(object, -1, unit);
      }
    }

    fx.cloud(unit.bounds(), [
      [sprites.p_star_1, sprites.p_star_2, sprites.p_star_3],
      [sprites.p_star_2, sprites.p_star_3, sprites.p_star_4],
      [sprites.p_star_1, sprites.p_star_3],
    ]).burst(10).remove();
  };

  unit.addBehaviour(heal);
  return unit;
}
```

These behaviours were great for prototyping, and many enemies came together incredibly quickly as a result. My favourite example is the [`Summon`](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/behaviours.ts#L144) behaviour which I built so that the [`Piper`](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/objects.ts#L260-L268) could _summon_ rats as he comes through the level. This ended up becoming the core mechanic for [`Wizard`](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/objects.ts#L357) who _summons_ portals. In turn, those portals _summon_ random enemies.

![](/images/norman-behaviours-wizard.gif)

I had already drawn a sprite for the wizard before I decided on the behaviour, but it must have taken about 5 minutes to draw the portal sprite, define the particle effects, and add the summon behaviours to both. These kinds of feedback cycles make a huge difference for development velocity!

### 5. Music
It's easy to overlook sound as an important part of making a game, but it makes a _huge_ difference. I debated writing about sound in the _What Didn't Work_ section, because I was disappointed not to get any sound effects into the game. However, I'm still pleased with how the musical aspects turned out.

I decided to make the music in the game build as Norman progresses through the waves of villagers. Things start with a solitary "organ" pedalling away at a single note, before its joined by a randomly generated bassline, and eventually a kick drum. I tried generating lead synth lines, hi-hats and snare layers, but they all ended up having so much procedural variance that I didn't feel comfortable keeping them.

<center>
<audio src="/audio/norman-music.mp3" controls></audio><br />
<em>A flavour of the music from the game</em>
</center>

Aside from being ridiculously fun to implement and a great chance to apply some music theory to programming, procedurally generated music has a significant benefit for developers. You don't go crazy listening to the same short melody again and again!

I regularly found myself tapping a foot, determined not to lose a given run because I was enjoying a particular groove too much to let it stop.

Here's an example of how these tracks get setup.

```ts
sequence([A4, H, A4, H], -36, synths.kick);
sequence([A4, E, A3, E], -36, synths.ambientOrgan);
sequence(createBassline(), -24, synths.bass);
```

The first parameter is a contiguous array of note indices and note lengths (for example `A4` being `0` which represents 440hz, and `H` is a half note, which lasts for half the length of a bar).

Next there's a _detune_ parameter, which can be used to shift the whole phrase up down (multiples of 12 are octaves) which makes it easier to write/generate patterns across 3 octaves (I chose `A3` to `G5`) then shift them up or down depending on which instrument is going to play them.

The synths themselves are more complicated combinations of oscillators, gain nodes, filters, and effects, with plenty of manually tweaked ramping to keep things sounding smooth.

```ts
function Kick(): Synth {
  let synth = Synth();
  synth.filter.type = "lowpass";
  synth.filter.frequency.value = 80;
  synth.osc.frequency.value = 150;
  synth.play = time => {
    synth.osc.frequency.setValueAtTime(150, time);
    synth.gain.gain.setValueAtTime(1, time);
    synth.filter.frequency.setValueAtTime(80, time);
    synth.osc.frequency.exponentialRampToValueAtTime(0.001, time + 0.5);
    synth.gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    synth.filter.frequency.linearRampToValueAtTime(0.001, time + 0.5);
  };
  return synth;
}
```

In addition to the gradual layering of tracks throughout the game, there are other events which require changes in synths and sequencing, and this ended up being tricky to orchestrate. For example, when you go into a shop, the kick drum stops, to take off some pressure, and when you reach the game's finale, a completely different track starts, with synths coming back in at different phases of the fight. I basically cheated to make this work by having everything playing at all times and using individual gain nodes to bring instruments in and out.

Music was easily the biggest rabbit hole in this project for me and I spent days tweaking parameters, fiddling with filters, building a sequencer, and procedurally generating tracks. This was the first time I've really explored procedural audio, but I don't think it's going to be the last! I'm going to save the fun details for another blog post one day, but check out [`sounds.ts`](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/sounds.ts) if you want to see how it works.

## What Didn't Work?
The long tail of the jam ended up being lots of polishing, tweaking, balancing, and refactoring. Despite that, the game still has lots of rough edges and some pretty serious mechanical deficiencies.

### 1. Balance
If you played Norman, then you'll know that the balance is pretty wack. If you get past the difficulty spike on level 5, then there's a good chance by the end you will have performed most of the rituals. You'll have more souls than you can spend. There's no longer any need to aim. Occasionally click vaguely on the right side of the screen and enemies will have a hard time making it past the barrage of particles that fill the viewport.

Many games designed around synergies have combinations which are powerful enough to be considered "broken" but it's important that these occurrences are rare enough that they stay novel, otherwise they become boring. Unfortunately that's what happened with Norman.

Let's quickly talk about the basic progression mechanics to understand what went wrong here. When villagers die (either from spells or skeletons) Norman earns a fixed number of souls (based on the enemy type). At the end of each level, Norman can spend those souls to perform rituals which serve as the game's only upgrade system.

The problem is that it's too easy to earn souls, and by the end of a playthrough you have generally earned so many souls that you can have performed all the rituals you've been offered. There's a tricky line to walk for something like a game jam, people are only likely to play your game for a few minutes, and I wanted them to see the variety in the game play.

I tried a few different strategies for balancing rituals. First, separating them into rare and common tiers, and ensuring that the rare rituals cost more, and can be offered once per level. The other approach to balancing I tried was to make enemies that punish the player for not playing tactically.

The simplest example is the big shelled knights that spend half their time inside their shells, invulnerable. Most spells are wasted (unless they inflict a status effect like bleed) at this phase. However, this turned out not to be punishing enough if the player just keeps on spamming, so I created an angry red knight who had a "bleeding" state which reflects damage back to Norman. This wasn't intuitive and he ended up getting nerfed down to simply healing if he is damaged whilst "enraged". The final iteration of this design ended up being the King's Guards, a late game enemy, who use their shields to reflect projectiles back at Norman.

![](/images/norman-royal-guard.gif)

_These guys used to reflect Norman's own projectiles back at him, until I inflicted bleed on myself during a playthrough and realised there was no cure._

Generally, I think that little games are better off being interesting and easy, than boring and hard, but I do wish I'd landed on a better balance. Ideally, players could have enjoyed working their way to the end of the game across a few runs, rather than it being possible to completely steamroll the entire thing on their first try.

### 2. Resurrection Mechanics
For a game about necromancy, the resurrection mechanic should have been a primary focus and strategy, but instead it took a bit of a backseat to the overpowered, colourful spellcasting. There's very little guidance explaining the resurrections and it's quite possible to beat the game without using it once.

When villagers meet their demise, they have a fixed chance to drop a skull onto the ground. One of Norman's talents is the power to bring each of those corpses back to defend him, as a skeletal thrall, marching against the villagers.

I designed quite a few of the rituals around this ability, ultimately it just wasn't as fun as bouncing lightning off the ceiling. The closest I got to a satisfying mechanic here was the "Riders" ritual, which summoned a bone chariot after each resurrection.

![](/images/norman-bone-chariot.gif)

Sadly, I couldn't justify the enormous sprite for a relatively small mechanic, and this ritual ended up getting replaced by ["Allegiance"](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/rituals.ts#L208).

In retrospect, I think that I should have worked harder to weave resurrections deeper into the other core mechanics. One idea that I'd like to have tried would be making resurrections the only way to earn souls.

### 3. UI / Controls
Whilst functional, the user interface for this game is a bit of a mess. I can't really blame the budget too much here either, I ended up being too complacent about the early-stage prototype user interfaces and running out of time to build proper versions.

The worst offender is the shop UI. It's completely text based and the "Continue" option is an item you buy for zero souls, which causes the shop to close. That's the level of hacky we're talking here. To make matters worse, it can only be controlled with keyboard, making it inaccessible to mobile users, creating a glaring inconsistency with the controls outside the shop, which have no key bindings.

The game is awkward to play on a trackpad, compared to a mouse, because it involves lots of simultaneous aiming and clicking—a perfect fit for keyboards—but I quickly scrapped my naive keyboard controls implementation because I didn't have the budget to handle smooth angular velocity for aiming. I think this game would also work quite well with a gamepad, the joysticks are a perfect fit for aiming, and a pair of triggers would do nicely for casting/resurrecting.

The rest of the game UI is pretty minimal, and it works well enough, but it doesn't feel polished to me. One notable problem is that you can't review your rituals anywhere. This relies on the player remembering what they picked, or otherwise inferring it from what's happening onscreen.

For a game jam, these sins are probably forgivable, but for a version of this game that I would be happy to call _finished_, I'd probably want a menu, an integrated tutorial, and clearer indicators for souls, streaks, and the resurrection mechanic cooldown.

### 4. Narrative
I enjoyed building a little storyline around the game as I went along. A mostly benign necromancer, cast out from his local village, and seeking refuge from the angry mob of villagers; villagers determined to put an end to his morbid curiosities. Sadly, I wasn't able to translate very much of this into the game itself in a satisfying way.

On the day of submission, I hacked together a quick dialogue system that would set the scene with a few quickly written sentences, and give a vague conclusion after the end of the final level. These dialogues look as hacky as they sound. I didn't even manage to fix the alignment on the ending dialogue, so you'll notice that it's all skewed to the left of the screen.

The game has a novel cyclical structure where after Norman dies, he becomes skeletal remains that can be resurrected to start the next attempt. However, the implementation is incredibly jarring. How's this for a bodge?

```ts
player.onDeath = () => window.location = window.location;
```

Story is a hard thing to get right in action games. No one is going to read a wall of text, but working the narrative into the game itself is an incredibly difficult feat to pull off. I'm reminded of the genius of Supergiant's [Hades](https://store.steampowered.com/app/1145360/Hades/) which manages an immaculate blend of run-based gameplay, which also advances an interwoven character-driven storyline as you progress. I'd love to figure out a better balance for narrative in games that I create in the future.

### 5. Submission
My motivation for developing the game dipped noticeably in September, and the morning of the submission ended up being a bit of a crunch. After thinking I had been over budget for days, I realised I'd made a [rookie error in my measuring script](https://github.com/danprince/norman-the-necromancer/commit/b3577738deed453abd17a8e9f4d515a51ff0e84e), which freed up space to smooth off some edges and try some last minute balancing.

Note to future self: you should not be making commits [like this](https://github.com/danprince/norman-the-necromancer/commit/f11214147a9f08db2050ecbedb9f28de941ba28e) in the final few minutes:

> Showing 12 changed files with 111 additions and 53 deletions.

I had no time to play test many of these changes, and they were done on instinct, worryingly close to the end of the jam. I didn't check the submission format ahead of time, and it hadn't even occurred to me that I'd need a screenshot and a textual description of the game. That's why the [game's page](https://js13kgames.com/entries/norman-the-necromancer) has a stretched, blurry image, and nothing but the basic controls as text. 

I actually ended up submitting a broken game, because my final build tried to load the spritesheet from an absolute path (fine in development and fine on the Netlify version) but because JS13K hosts games at unique paths, there was a 404 and nothing to see. Thanks to Andrzej for accepting an "oh shit" resubmission after the deadline!

The lesson learned here is that the final day should be saved for the submission. The screenshot is especially important to get right, because the name and thumbnail are all that reviewers have to go on when selecting a game to try from a list of hundreds.

Next time I'll also try using the [bot](https://github.com/js13kGames/bot) to submit.

## What's Next?
Well, it took me roughly three months to cobble together this retrospective, so I wouldn't hold your breath for updates to the game, but it's been fun revisiting the codebase, and considering this is _jam code_, it's really quite approachable. Folks have [contributed bugfixes](https://github.com/danprince/norman-the-necromancer/pulls?q=is%3Apr+is%3Aclosed) and others have even forked the game to [remix their own versions](https://63832559acf33a4e8ea9c543--subtle-hotteok-e1718e.netlify.app/).

I suspect that if I revisit the game one day, it'll be a ground up rewrite, which will undo some of the simplifications from the original to create a more balanced game, and to clean up some of the hackier patterns that appeared later into development.

However, in the meantime, writing this post has inspired me to dive deeper into randomly generated audio, and to write some focused articles on particle effects and tweening in the future. Watch this space!

JS13K is an incredible jam, and every year I learn something new from the creative ways that people manage to squeeze technically, mechanically, and visually impressive games into the budget. Far too few games are open sourced so I'm always grateful that this jam makes that a part of the submission criteria.

Thanks to everyone involved in JS13K, from the organisers to the other developers, and everyone that played and rated the games. It was a highlight of my year. See you all again next time!
