---
title: A Particle Emitter in 100 Lines of Code
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
---

Why Would You Want Particle Effects?
- What is a Particle?
- What is a Particle Emitter?

## Implementation
An emitter is not an entire particle system, it just happens to be the bit where most of the interesting programming happens.

- Rendering
- Animation

### Units

### Randomness
This whole article would be pretty boring if every particle had the same direction, speed, mass, and texture. We can't create interesting particle emitters without randomisation!

But randomisation has its own set of challenges. Not enough randomness looks uniform, and too much randomness looks chaotic.

Our particle emitter uses ranges to describe the allowed set of random values a particle can take when it spawns. These ranges are two element arrays.

```ts
[100, 10] // generates values between 100 and 110
```

The first element is the base value. The second element is the spread. It might seem more intuitive to express this kind of range as `[100, 110]` but that would make it much more awkward to change the values independently.

Throughout the rest of this article when there's an interactive example, you'll see <code style="color: blue">base</code> in blue and <code style="color: red">spread</code> in red.

{% island demos.ranges %}

### Velocity

{% island demos.velocity %}

{% island demos.velocity "base" 10 "spread" 20 %}

### Angle
{% island demos.angles %}

### Mass

### Lifetime / Time?

### Position

### Frequency

### Burst

### Sprites/Textures?

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
