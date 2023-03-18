---
title: Particles
styles:
  - /islands/particles/styles.css
demos:
  ranges:
    src: /islands/particles/demos.js
    export: RangeDemo
  velocity:
    src: /islands/particles/demos.js
    export: VelocityDemo
  angles:
    src: /islands/particles/demos.js
    export: AngleDemo
  mass:
    src: /islands/particles/demos.js
    export: MassDemo
  position:
    src: /islands/particles/demos.js
    export: PositionDemo
  frequency:
    src: /islands/particles/demos.js
    export: FrequencyDemo
  burst:
    src: /islands/particles/demos.js
    export: BurstDemo
  sprite:
    src: /islands/particles/demos.js
    export: SpriteDemo
---

- TODO: disable the emitters that are not onscreen

Why Would You Want Particle Effects?
- What is a Particle?
- What is a Particle Emitter?

An emitter is not an entire particle system, it just happens to be the bit where most of the interesting programming happens.

- Rendering
- Animation

### Randomness
This whole article would be pretty boring if every particle had the same direction, speed, mass, and texture. We can't create interesting particle emitters without randomisation!

But randomisation has its own set of challenges. Not enough randomness looks uniform, and too much randomness looks chaotic.

Our particle emitter uses ranges to describe the allowed set of random values a particle can take when it spawns. Usually these ranges are defined as a "base" value, and a "spread" value.

Throughout the rest of this article when there's an interactive example, you'll see <code style="color: blue">base</code> in blue and <code style="color: red">spread</code> in red.

{% island demos.ranges %}

Separating these two values makes it easier to create dynamic particle effects, because we can edit the values independently.

### Velocity
Let's look at the 

{% island demos.velocity %}

{% island demos.velocity "base" 10 "spread" 20 %}

### Angle
{% island demos.angles %}

### Mass
{% island demos.mass %}
{% island demos.mass "base" 10 "spread" 20 %}

### Lifetime / Time?

### Position
{% island demos.position %}

### Frequency
{% island demos.frequency %}

### Burst
{% island demos.burst %}

### Sprites/Textures?
{% island demos.sprite %}

## Examples
- Fire
- Rain
- Smoke
- Bouncy balls
- Coins
- Meteors
- Stars
- Dust
- Bones
- Explosion
- Fireworks
- Blood

## Extensions
- Opacity
- Pooling
- Collisions
- Bounding box
- Directional Gravity
- Keyframes
- Weighted random
- Paths
- Systems
- Colors/tints
- Relative space
- Scaling
- Benchmarking
- GPU
