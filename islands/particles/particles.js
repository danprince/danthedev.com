import { isBrowser } from "../helpers.js";

/**
 * @typedef {object} Particle
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {number} mass
 * @property {number} age
 * @property {number} life
 * @property {number} bounce
 * @property {number} variant
 *
 * @typedef {object} Sprite
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 *
 * @typedef {object} ParticleEmitterOptions
 * @property {number} [x]
 * @property {number} [y]
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [frequency]
 * @property {number} [floor]
 * @property {number} [velocity]
 * @property {number} [velocitySpread]
 * @property {number} [mass]
 * @property {number} [massSpread]
 * @property {number} [angle]
 * @property {number} [angleSpread]
 * @property {number} [life]
 * @property {number} [lifeSpread]
 * @property {number} [bounce]
 * @property {number} [bounceSpread]
 * @property {[Sprite, ...Sprite[]][]} variants
 */

/**
 * A list of unused particles that emitters can draw from to save memory.
 * @type {Particle[]}
 */
let pool = [];

export class ParticleEmitter {
  /**
   * The particles that are active inside this emitter.
   * @type {Particle[]}
   */
  particles = [];

  /**
   * Internal clock which tracks the number of seconds since we last spawned a
   * particle.
   * @private
   * @type {number}
   */
  clock = 0;

  /**
   * @param {ParticleEmitterOptions} options
   */
  constructor(options) {
    /**
     * The base x coordinate that particles will spawn at.
     */
    this.x = options.x ?? 0;
    /**
     * The base y coordinate that particles will spawn at.
     * @type {number}
     */
    this.y = options.y ?? 0;
    /**
     * The width of the rectangle that particles can spawn in.
     * @type {number}
     */
    this.width = options.width ?? 0;
    /**
     * The height of the rectangle that particles can spawn in.
     * @type {number}
     */
    this.height = options.height ?? 0;
    /**
     * The height of the rectangle that particles can spawn in.
     * @type {number}
     */
    this.floor = options.floor ?? Infinity;
    this.velocity = options.velocity ?? 0;
    this.velocitySpread = options.velocitySpread ?? 0;
    this.mass = options.mass ?? 0;
    this.massSpread = options.massSpread ?? 0;
    this.angle = options.angle ?? 0;
    this.angleSpread = options.angleSpread ?? 0;
    this.life = options.life ?? 0;
    this.lifeSpread = options.lifeSpread ?? 0;
    this.bounce = options.bounce ?? 0;
    this.bounceSpread = options.bounceSpread ?? 0;
    this.frequency = options.frequency ?? 1;
    this.variants = options.variants;
  }

  emit() {
    let particle = pool.pop() || /** @type {Particle} */ ({});
    let velocity = this.velocity + this.velocitySpread * Math.random();
    let angle = this.angle + this.angleSpread * Math.random();
    particle.x = this.x + this.width * Math.random();
    particle.y = this.y + this.height * Math.random();
    particle.vx = Math.cos(angle) * velocity;
    particle.vy = Math.sin(angle) * velocity;
    particle.mass = this.mass + this.massSpread * Math.random();
    particle.life = this.life + this.lifeSpread * Math.random();
    particle.bounce = this.bounce + this.bounceSpread * Math.random();
    particle.variant = Math.floor(Math.random() * this.variants.length);
    particle.age = 0;
    this.particles.push(particle);
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    let seconds = dt / 1000;
    let secondsPerParticle = 1 / this.frequency;

    this.clock += seconds;
    while (this.clock >= secondsPerParticle) {
      this.clock -= secondsPerParticle;
      this.emit();
    }

    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx * seconds;
      particle.y += particle.vy * seconds;
      particle.vy += particle.mass * seconds;
      particle.age += seconds;
      if (particle.y > this.floor) {
        particle.vy *= -particle.bounce;
        particle.y = this.floor;
      }
      return particle.age < particle.life;
    });
  }

  /**
   * @param {(sprite: Sprite, x: number, y: number) => void} draw
   */
  render(draw) {
    for (let particle of this.particles) {
      let progress = particle.age / particle.life;
      let spriteIndex = Math.floor(progress * this.variants.length);
      let sprite = this.variants[particle.variant][spriteIndex];
      draw(sprite, particle.x, particle.y);
    }
  }
}

/**
 * @type {HTMLImageElement}
 */
let spritesImage;

if (isBrowser) {
  spritesImage = new Image();
  spritesImage.src = "/img/particles.png";
}

export let sprites = {
  blue_circle: { x: 0, y: 0, w: 4, h: 4 },
  smoke_1: { x: 4, y: 0, w: 6, h: 6 },
  smoke_2: { x: 10, y: 0, w: 6, h: 6 },
  smoke_3: { x: 16, y: 0, w: 6, h: 6 },
  smoke_4: { x: 22, y: 0, w: 6, h: 6 },
};

export class ParticleSystem {
  scale = 3;

  /**
   * @param {object} params
   * @param {number} [params.width]
   * @param {number} [params.height]
   * @param {ParticleEmitter[]} [params.emitters]
   */
  constructor({ width = 100, height = 100, emitters = [] } = {}) {
    // We don't have DOM stuff for static renders, so we need bail early.
    if (!isBrowser) {
      // @ts-ignore (mock the canvas for stuff that needs it's dimensions)
      this.canvas = { width, height };
      return;
    }

    /**
     * @type {ParticleEmitter[]}
     */
    this.emitters = emitters;
    /**
     * @type {HTMLCanvasElement}
     */
    this.canvas = document.createElement("canvas");
    /**
     * @type {CanvasRenderingContext2D}
     */
    this.ctx = /** @type {CanvasRenderingContext2D} */ (
      this.canvas.getContext("2d")
    );

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${this.canvas.width * this.scale}px`;
    this.canvas.style.height = `${this.canvas.height * this.scale}px`;
    this.canvas.style.imageRendering = "pixelated";
    this.ctx.imageSmoothingEnabled = false;
    //this.start();
  }

  active = false;

  start() {
    this.active = true;
    let lastFrameTime = 0;

    /**
     * @param {number} currentFrameTime
     */
    let tick = currentFrameTime => {
      if (!this.active) return;
      requestAnimationFrame(tick);
      lastFrameTime ||= currentFrameTime;
      let dt = currentFrameTime - lastFrameTime;
      lastFrameTime = currentFrameTime;
      this.update(dt);
      this.render();
    };

    // Reset the timer when we return to the tab so that we don't get one crazy
    // long frame that will emit hundreds of particles in one shot.
    window.addEventListener("focus", () => {
      lastFrameTime = 0;
    });

    requestAnimationFrame(tick);
  }

  stop() {
    this.active = false;
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    for (let emitter of this.emitters) {
      emitter.update(dt);
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let emitter of this.emitters) {
      emitter.render((sprite, x, y) => {
        let { x: sx, y: sy, w: sw, h: sh } = sprite;
        let dx = Math.floor(x - sw / 2);
        let dy = Math.floor(y - sh / 2);
        this.ctx.drawImage(spritesImage, sx, sy, sw, sh, dx, dy, sw, sh);
      });
    }
  }

  /**
   * @param {HTMLElement | null} element
   */
  mount = element => {
    element?.append(this.canvas);
  };

  /**
   * @param {number} screenX
   * @param {number} screenY
   * @returns {[x: number, y: number]}
   */
  mapCoords(screenX, screenY) {
    let bounds = this.canvas.getBoundingClientRect();
    let scaleX = this.canvas.width / bounds.width;
    let scaleY = this.canvas.height / bounds.height;
    let x = (screenX - bounds.x) * scaleX;
    let y = (screenY - bounds.y) * scaleY;
    return [x, y];
  }
}
