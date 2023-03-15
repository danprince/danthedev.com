import { isBrowser } from "../helpers.js";

/**
 * @typedef {[number, number]} Range
 * @typedef {{ x: number, y: number, w: number, h: number }} Sprite
 *
 * @typedef {object} Particle
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {number} mass
 * @property {number} age
 * @property {number} lifetime
 * @property {number} bounce
 */

/**
 * @type {Particle[]}
 */
let pool = [];

export class ParticleEmitter {
  /**
   * @type {Particle[]}
   */
  particles = [];
  /**
   * @type {number}
   */
  clock = 0;

  /**
   * @param {object} options
   * @param {number} [options.x] The X coordinate of the left of the spawn area.
   * @param {number} [options.y] The Y coordinate of the top of the spawn area.
   * @param {number} [options.width] The width of the spawn area in pixels.
   * @param {number} [options.height] The height of the spawn area in pixels.
   * @param {number} [options.frequency] The number of particles to emit each second.
   * @param {number} [options.floor] The Y coordinate of the floor (particles bounce here).
   * @param {Range} [options.velocity] The range of values for initial particle velocity, a scalar value in pixels per second.
   * @param {Range} [options.mass] The range of values for initial particle mass.
   * @param {Range} [options.angle] The range of values for initial particle angle in radians.
   * @param {Range} [options.lifetime] The range of values
   * @param {Range} [options.bounce] A range of normalized bounciness factors (0–1).
   * @param {[Sprite, ...Sprite[]]} options.sprites A non-empty array of sprites
   */
  constructor(options) {
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.width = options.width ?? 0;
    this.height = options.height ?? 0;
    this.floor = options.floor ?? Infinity;
    this.velocity = options.velocity ?? [0, 0];
    this.mass = options.mass ?? [0, 0];
    this.angle = options.angle ?? [0, 0];
    this.lifetime = options.lifetime ?? [0, 0];
    this.bounce = options.bounce ?? [0, 0];
    this.sprites = options.sprites;
    this.frequency = options.frequency ?? 1;
    this.clock = 0;
  }

  emit() {
    let particle = pool.pop() || /** @type {Particle} */ ({});
    let velocity = this.velocity[0] + this.velocity[1] * Math.random();
    let angle = this.angle[0] + this.angle[1] * Math.random();
    particle.x = this.x + this.width * Math.random();
    particle.y = this.y + this.height * Math.random();
    particle.vx = Math.cos(angle) * velocity;
    particle.vy = Math.sin(angle) * velocity;
    particle.mass = this.mass[0] + this.mass[1] * Math.random();
    particle.lifetime = this.lifetime[0] + this.lifetime[1] * Math.random();
    particle.bounce = this.bounce[0] + this.bounce[1] * Math.random();
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
      return particle.age < particle.lifetime;
    });
  }

  /**
   * @param {(sprite: Sprite, x: number, y: number) => void} draw
   */
  render(draw) {
    for (let particle of this.particles) {
      let progress = particle.age / particle.lifetime;
      let spriteIndex = Math.floor(progress * this.sprites.length);
      let sprite = this.sprites[spriteIndex];
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
    this.start();
  }

  start() {
    let lastFrameTime = 0;

    /**
     * @param {number} currentFrameTime
     */
    let tick = currentFrameTime => {
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
