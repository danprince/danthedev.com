---
title: Norman the Necromancer
description: A post-mortem of a necromantic action game.
points:
- Record all of your ideas
- Concatenative inheritance is great
- Move complexity out of classes
- Particles everywhere
- Tweens can stand in for animations
- Find playtesters
- Balance is hard
- Some of the hacks make it to the end game
- Hardcode the levels, randomise the rituals
- There's always room for more
---

I often take part in the annual [JS13K](https://js13kgames.com/), a month long jam, building a game for the web that must not exceed 13KB. Most engines, fonts, textures, and audio samples will immediately blow the entire budget, so almost everyone works from scratch.

When it was announced that ["DEATH"](https://medium.com/js13kgames/js13kgames-2022-has-started-73a7bd31721b) was this year's theme, I dusted off an unimplemented idea from a few years ago, under the heading "Norman the Necromancer"—complete with pixel art mockup:

> &ldquo;Play as an outcast necromancer trying to learn to reanimate corpses whilst being hunted by the inhabitants of the local village&rdquo;.
>
> {% image "/img/2023-01-03-22-48-04.png" "An early mockup of how the game might look" %}

This year was the first time I actually finished the month with a game to submit. Let's look at what worked, what didn't, and what I learned in the process of building ["Norman the Necromancer"](https://js13kgames.com/games/norman-the-necromancer/index.html).

[[toc]]

## What Worked Well?
Not only was I happy enough with the game to submit it, but it also ended up coming in [3rd place](https://js13kgames.com/#winners) so it feels fair to say that some aspects of the game worked well.

### 1. Visuals
I think Norman the Necromancer is (mostly) a great looking game and the visuals can be one of the hardest challenges with a 13KB game. Many of the traditional options leave you almost no room to implement the game, but pixel art is one of the most efficient ways to pack detail into those precious bytes, and it just so happens that I love making pixel art.

I prefer pixelling at lower resolutions, and I managed to fit 83 sprites and a 96 character font into a 160x70 spritesheet.

{% image "/img/2023-01-04-22-48-38.png" "" %}

For anyone that's curious, I use [Aseprite](https://www.aseprite.org/) and those blue rectangles are [slices](https://www.aseprite.org/docs/slices/) that define named sprites. The bounds of each sprite are exported to a [JSON file](https://github.com/danprince/norman-the-necromancer/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/sprites.json) so that I can refer to sprites by name. TypeScript's [`resolveJsonModule` option](https://www.typescriptlang.org/tsconfig#resolveJsonModule) ensures that I get a compile time error if anything goes out of sync.

It might seem like an odd decision to include a font as part of the spritesheet, but it's almost impossible to render a true font at this resolution (a 400x200 canvas) without blurry anti-aliasing problems. It's possible to just render text with HTML and a web safe font, but that sort of ruins the whole pixel aesthetic, and I like drawing fonts and implementing text renderers!

I managed to hide the fact that the sprites in the game are incredibly static, with a mixture of tweens and particle effects. These are both classic ["juice"](https://www.youtube.com/watch?v=Fy0aCDmgnxg) techniques and they both go a long way to the game feel alive. Rather than drawing out a walk cycle, entities hop their way down the corridor with a sinusoidal tween. For almost everything else, I just attached particle emitters to the game objects and burst them to show when something happened.

<div style="display: flex; justify-content: space-around;">
{% image "/img/norman-particles-bones.gif" "" %}
{% image "/img/norman-particles-monk.gif" "" %}
{% image "/img/norman-particles-heal.gif" "" %}
</div>

There's a lot more to say about particle effects in this game, so let's talk about spells!

### 2. Spells
Despite the necromancer context and narrative, this game largely ended up being a game about magic and spells. I'll talk more about the resurrection mechanics later, but the spellcasting system ended up being the one I explored the most throughout development.

Some people who played the game pointed out a visual similarity to [Noita](https://noitagame.com/), which is interesting–partly because I think Noita is a gorgeous game—and partly because it wasn't a visual reference I used. I suppose when you're using single pixel particle effects its hard to create a unique visual identity. However, Noita was a major influence on the way I thought about the spellcasting mechanics, with its [cyclical wand mechanics](https://noita.fandom.com/wiki/Guide_To_Wand_Mechanics) and synergistic collection of spells.

The basic casting mechanics are very barebones. The player chooses an angle and shoots a gravity-affected projectile at a fixed velocity. Not a huge amount of fun, but the really interesting stuff happens when you use souls to perform rituals at the end of each level. Many of these rituals permanently change the way that Norman's spellcasting works.

For example, "Drunkard" makes the spells stronger, but messes with your aim, "Weightless" negates the effects of gravity, "Bleed" adds a bleeding status to anything your spells hit, "Hunter" adds a guidance system to projectiles, and on and on. The goal was to have a large enough variety of rituals that every playthrough would feel different. That didn't quite happen, but more on that later!

### 3. Objects
Almost everything you see in the foreground of this game is a [GameObject](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/game.ts#L29) but you won't find `extends GameObject` anywhere in the codebase. This flat architecture has two separate roots. The first is the codebase for [Rift Wizard](https://store.steampowered.com/app/1271280/Rift_Wizard/) (I ended up diving into the source whilst trying to get it to run on Mac) where units are defined inside factory functions, and the second is the message about classes working really well for shallow but wide inheritance hierarchies, from the talk ["Is There More to Game Architecture than ECS?"](https://www.youtube.com/watch?v=JxI3Eu5DPwE).

Here's the code for `Villager` (the default type of enemy).

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

Then other types of units can base themselves on this one. For example, the "Piper" starts as a villager, but then gets a different sprite, some stat tweaks, and a special behaviour.

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

This is still just single inheritance, when you squint, but it's a charmingly simple version of it. I used exactly the same pattern for spells. These are the projectiles that are cast by the default spell.

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

These game objects and patterns ended up being flexible enough that they never really got in the way of inspiration whilst programming. It also results in less code than a classical inheritance model, which is great for JS13K, but still suffers from ["the diamond problem"](https://en.wikipedia.org/wiki/Multiple_inheritance#The_diamond_problem) and might struggle to scale up for games with significant behavioural complexity.

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

Here's the implementation for the invulnerable behaviour, which prevents certain enemies from taking damage in some scenarios.

```ts
export class Invulnerable extends Behaviour {
  sprite = sprites.status_shielded;

  onDamage(damage: Dmg): void {
    if (damage.amount > 0) damage.amount = 0;
  }
}
```

There are plenty of other generic behaviours like [`March`](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/behaviours.ts#L34) which makes objects hop along the corridor in a given direction (useful for skeletons and villagers), and [`DespawnTimer`](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/behaviours.ts#L20) which despawns an object after a certain amount of time has elapsed (useful for preventing spells from bouncing indefinitely), but if you poke around in the codebase, you'll see quite a few anonymous behaviours.

For example, the monk character heals once every 5 turns. If there were lots of healers in the game, or this behaviour required tracking internal state, then it might make sense to pull this out into a reusable behaviour, but for now, the entire behaviour is defined in the function that creates monks.

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

These behaviours were great for prototyping, and many enemies came together incredibly quickly as a result. My favourite example is the [`Summon`](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/behaviours.ts#L144) behaviour which I built so that the [`Piper`](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/objects.ts#L260-L268) could summon rats as he danced through the level. This ended up becoming the core mechanic for [`Wizard`](https://github.com/danprince/js13k-2022/blob/cc9ba92ffd5f5bc19e0f5a0bbb38847b2651611e/src/objects.ts#L357) who _summons_ portals as he walks through the level, in turn, those portals _summon_ random enemies.

{% image "/img/norman-behaviours-wizard.gif" "" %}

I had already drawn a sprite for the wizard before I decided on the behaviour, but it must have taken about 5 minutes to draw the portal sprite, define the particle effects, and add the summon behaviours to both. These kinds of feedback cycles make a huge difference for development velocity!

### 5. Music
It's very easy to overlook sound as an important part of making a game, but it makes a _huge_ difference to whether it feels like you're playing a tech demo or a game. I debated writing about sound in the _What Didn't Work_ section, because I wasn't able to get any sound effects into the game, which was a shame, however, I'm still pleased with how the musical aspects turned out.

I decided to make the music in the game build as Norman progresses through the waves of villagers. Things start with a solitary "organ" pedalling away at a single note, before its joined by a randomly generated bassline, and eventually a kick drum. I tried generating lead synth lines, hi-hats and snare layers, but they all ended up having so much procedural variance that I didn't feel comfortable keeping them.

<center>
<audio src="/audio/norman-music.mp3" controls></audio><br />
<em>A flavour of the music from the game</em>
</center>

Aside from being ridiculously fun to implement, procedurally generated music has a significant benefit for developers. You don't go crazy listening to the same short melody again and again!

Here's an example of how these tracks get setup.

```ts
sequence([A4, H, A4, H], -36, synths.kick);
sequence([A4, E, A3, E], -36, synths.ambientOrgan);
sequence(createBassline(), -24, synths.bass);
```

The first parameter is a contiguous array of note indices and note lengths (`A4` being `0` which represents 440hz, and `H` is a half note, which lasts for half the length of a bar).

Next there's a _detune_ parameter, which can be used to shift the whole phrase up down (multiples of 12 are octaves) which makes it easier to write/generate patterns across 3 octaves (`A3` to `G5`) then shift them up or down depending on which instrument is going to play them.

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
Much of the game came together in the first three or four days of the jam, and the long tail ended up being lots of polishing, tweaking, balancing, and refactoring. Despite that, the game still has lots of rough edges and some pretty serious mechanical deficiencies.

### 1. Balance
If you played Norman, then you'll know that the balance is pretty wack. If you get past the difficulty spike on level 5, then there's a pretty good chance by the end of the game you will have performed every ritual, and that enemies will have a hard time making it past the overpowerred barrage of particles that fill the screen.

Many games designed around synergies have combinations which are powerful enough to be considered "broken" but it's important that these occurrences are rare enough that they stay novel, otherwise they become boring. Unfortunately that's what happened with Norman.

Let's quickly talk about the basic progression mechanics to understand what went wrong here. When villagers die (either from spells or skeletons) Norman earns a fixed number of souls (based on the enemy type). At the end of each level, Norman can spend those souls to perform rituals which serve as the game's only upgrade system.

The problem is that it's too easy to earn souls, and by the end of a playthrough you have generally earned so many souls that you can have performed all the rituals you've been offered. There's a tricky line to walk for something like a game jam, people are only likely to play your game for a few minutes, and I wanted them to see the variety in the game play.

I tried a few different strategies for balancing rituals. First, separating them into rare and common tiers, and ensuring that the rare rituals cost more, and can be offered once per level. The other approach to balancing I tried was to make enemies that punish the player for not playing tactically.

The simplest example is the big shelled knights that spend half their time inside their shells, invulnerable. Most spells are wasted (unless they inflict a status effect like bleed) at this phase. However, this turned out not to be punishing enough if the player just keeps on spamming, so I created an angry red knight who had a "bleeding" state which reflects damage back to Norman. This wasn't an intuitive mechanic and he ended up getting nerfed down to simply healing if he is damaged whilst "enraged". The final iteration of this design ended up being the King's Guards, a late game enemy, who use their shields to reflect projectiles back at Norman.

{% image "/img/norman-royal-guard.gif" "" %}

Generally, I think these kinds of little games are better off being interesting and easy, than boring and hard, but I do wish I'd landed a better balance here, so that people could have enjoyed working their way to the end of the game across a few runs, rather than it being possible to completely steamroll the entire thing on your first ever try.

### 2. Resurrection Mechanics
For a game about necromancy, the resurrection mechanic should have been a primary focus and strategy, but instead it took a bit of a backseat to the overpowered, colourful spellcasting. There's very little guidance explaining the resurrections and it's quite possible to beat the game without using it once.

When villagers meet their demise, they have a fixed chance to drop a skull onto the ground. One of Norman's talents is the power to bring each of those corpses back to defend him, as a skeletal thrall, marching against the villagers.

I designed quite a few of the rituals around this ability, ultimately it just wasn't as fun as bouncing lightning off the ceiling. The closest I got to a satisfying mechanic here was the "Riders" ritual, which summons a bone chariot after each resurrection.

{% image "/img/norman-bone-chariot.gif" "" %}

Sadly, this was also wildy overpowered, and the sprite had to be removed to make space before submission.

In retrospect, I think that I should have tried harder to tie resurrections into the other core mechanics. Maybe resurrections should have been way you earn souls?

### 3. UI / Controls
Whilst functional, the user interface for this game is a bit of a mess. There are a few different problems in play here, that contribute to some feelings of inconsistency.

The first and worst problem in the UI is the shop. This is literally still the text only placeholder version that I built to test the functionality. The "Continue" option is an item you buy, which causes the shop to close. That's the level of hacky we're talking here. To make matters worse, it can only be controlled with keyboard, making it inaccessible to mobile users, creating a glaring inconsistency with the controls outside the shop, which have no key bindings. By the time I was ready to create a proper UI, I'd already run out of budget for new sprites and handling mouse interactions properly.

The game is awkward to play on a trackpad, compared to a mouse, because it involves lots of simultaneous aiming and clicking, a perfect fit for keys, but I quickly scrapped the naive implementation because I wasn't going to have the budget available to implement the aiming in a granular way. I think this game would also work quite well with a gamepad, the joysticks are a perfect fit for aiming, and a pair of triggers would do nicely for casting/resurrecting.

The rest of the game UI is pretty minimal, and it works well enough, but it doesn't feel polished to me. One notable problem is that you can't review your rituals anywhere. This relies on the player remembering what they picked, or otherwise inferring it from what's happening onscreen.

For a game jam, these sins are probably forgivable, but for a version of this game that I would be happy to call _finished_, I'd probably want a menu, an integrated tutorial, and clearer indicators for souls, streaks, and the resurrection mechanic cooldown.

### 4. Narrative
I enjoyed building a little storyline around the game as I went along, of a mostly benign necromancer, cast out from his local village, and seeking refuge from the angry mob of villagers, determined to put an end to his morbid curiosity. Sadly, I wasn't able to translate very much of this into the game itself in a satisfying way.

On the day of submission, I hacked together a quick dialogue system that would set the scene with a few quickly written sentences, and give a vague conclusion after the end of the final level. These dialogues look as hacky as they sound. I didn't even manage to fix the alignment on the ending dialogue, so you'll notice that it's all skewed to the left of the screen.

Narrative is a hard thing to get right in games. No one is going to read a wall of text, but working the narrative into the game itself is an incredibly difficult feat to pull off. I'm reminded of the genius of Supergiant's [Hades](https://store.steampowered.com/app/1145360/Hades/) which manages an immaculate blend of run-based gameplay, which also advances an interwoven character-driven storyline as you progress. I'd love to figure out a better balance for narrative for games that I create in the future.

## What's Next?
Well, it took me roughly three months to cobble together this post-mortem, so I wouldn't hold your breath for updates to the game, but it's been fun revisiting the codebase, and considering this is _jam_ code, it's really quite approachable. Folks have [contributed bugfixes](https://github.com/danprince/norman-the-necromancer/pulls?q=is%3Apr+is%3Aclosed) and others have even forked the game to [remix their own versions](https://63832559acf33a4e8ea9c543--subtle-hotteok-e1718e.netlify.app/).

I suspect that if I revisit the game one day, it'll be a ground up rewrite, which will undo some of the simplifications from the original to create a more balanced game, and to clean up some of the hackier patterns that appeared later into development.

However, in the meantime, writing this post has inspired me to dive deeper into randomly generated audio, and to write some focused articles on particle effects and tweening in the future. Watch this space!

JS13K is an incredible jam, and every year I learn something new from the creative ways that people manage to squeeze technically, mechanically, and visually impressive games into the budget. Far too few games are open sourced so I'm always grateful that this jam makes that a part of the submission criteria.

Thanks to everyone who tested and played the game, and thanks to everyone involved in organising the jam. See you all again next year!
