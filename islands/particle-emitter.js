import { h } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { isBrowser } from "./helpers.js";

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

class ParticleEmitter {
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

let sprites = {
  blue_circle: { x: 0, y: 0, w: 4, h: 4 },
};

class ParticleSystem {
  constructor() {
    // We don't have DOM stuff for static renders, so we need bail early.
    if (!isBrowser) return;

    /**
     * @type {ParticleEmitter[]}
     */
    this.emitters = [];
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

    this.canvas.width = 100;
    this.canvas.height = 100;
    this.canvas.style.width = `${this.canvas.width * 3}px`;
    this.canvas.style.height = `${this.canvas.height * 3}px`;
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

const PI_2 = Math.PI * 2;

/**
 * @param {number} radians
 * @returns {number}
 */
function normalizeRadians(radians) {
  return (radians % PI_2 + PI_2) % PI_2;
}

/**
 * @param {number} radians
 * @returns {number}
 */
function radiansToDegrees(radians) {
  return radians / (Math.PI / 180)
}

/**
 * @param {number} degrees
 * @returns {number}
 */
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * @param {number} number Number to format
 * @param {number} places Number of decimal places to include
 * @returns {number}
 */
function roundToFixed(number, places) {
  return Math.round(number * (10 ** places)) / (10 ** places);
}

/**
 * @param {number} radians
 * @returns {string}
 */
function formatRadians(radians) {
  if (radians === Math.PI) return `Math.PI`;
  if (radians === 2 * Math.PI) return `2 * Math.PI`;
  if (radians === Math.PI / 2) return `Math.PI / 2`;
  return roundToFixed(radians, 3).toString();
}

function useForceUpdate() {
  let [_, setState] = useState([]);
  return useCallback(() => setState([]), [setState]);
}

/**
 * @param {() => ParticleEmitter[]} createEmitters
 */
function useParticles(createEmitters) {
  let emitters = useMemo(createEmitters, []);
  let system = useMemo(() => new ParticleSystem(), []);
  system.emitters = emitters;
  return system;
}

/**
 * @param {object} props
 * @param {ParticleSystem} props.system
 * @param {(x: number, y: number) => void} [props.onPointerMove]
 * @param {(x: number, y: number) => void} [props.onPointerDown]
 * @param {(x: number, y: number) => void} [props.onPointerUp]
 * @param {() => void} [props.onPointerEnter]
 * @param {() => void} [props.onPointerLeave]
 * @param {import("preact").ComponentChildren} [props.children]
 */
function Canvas({ system, children, ...props }) {
  useEffect(() => {
    let { canvas } = system;

    /**
     * @param {PointerEvent} event
     */
    function onPointerMove(event) {
      let [x, y] = system.mapCoords(event.clientX, event.clientY);
      props.onPointerMove?.(x, y);
    }

    /**
     * @param {PointerEvent} event
     */
    function onPointerDown(event) {
      let [x, y] = system.mapCoords(event.clientX, event.clientY);
      props.onPointerDown?.(x, y);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }

    /**
     * @param {PointerEvent} event
     */
    function onPointerUp(event) {
      let [x, y] = system.mapCoords(event.clientX, event.clientY);
      props.onPointerUp?.(x, y);
      window.removeEventListener("pointermove", onPointerMove);
    }

    function onPointerEnter() {
      props.onPointerEnter?.();
      window.addEventListener("blur", onPointerLeave);
    }

    function onPointerLeave() {
      props.onPointerLeave?.();
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerenter", onPointerEnter);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("blur", onPointerLeave);
    }
  }, [system]);

  return h("div", {
    class: "canvas",
    ref: system.mount,
    style: { width: 300, height: 300, position: "relative" },
  },
    h("div", { class: "canvas-controls", style: { position: "absolute", top: 0, left: 0 }, children })
  );
}

/**
 * @param {object} props
 * @param {ParticleEmitter} props.emitter
 * @param {ParticleSystem} props.system
 * @param {() => void} props.onUpdate
 */
function ArcControls({ emitter, system, onUpdate }) {
  let [center, setCenter] = useState({ x: emitter.x, y: emitter.y });
  let [angle, setAngle] = useState(emitter.angle[0]);
  let [spread, setSpread] = useState(emitter.angle[1]);

  useEffect(() => {
    // Sync changes in state back to the emitter
    emitter.angle = [angle, spread];
    emitter.x = center.x;
    emitter.y = center.y;
    onUpdate();
  }, [angle, spread, center, emitter, onUpdate])

  // Control points
  let cx = emitter.x;
  let cy = emitter.y;
  let radius = 30;
  let x0 = cx + Math.cos(angle) * radius;
  let y0 = cy + Math.sin(angle) * radius;
  let x1 = cx + Math.cos(angle + spread) * radius;
  let y1 = cy + Math.sin(angle + spread) * radius;

  /**
   * @param {(x: number, y: number, event: PointerEvent) => void} callback
   */
  function createDragHandler(callback) {
    return function onPointerDown() {
      /**
       * @param {PointerEvent} event
       */
      function onPointerMove(event) {
        let [x, y] = system.mapCoords(event.clientX, event.clientY);
        callback(x, y, event);
      }

      function onPointerUp() {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      }

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    };
  }

  /**
   * @param {(angle: number) => void} callback
   */
  function createAngleDragHandler(callback) {
    let step = degreesToRadians(10);

    return createDragHandler((x, y, event) => {
      let angle = Math.atan2(y - cy, x - cx);
      angle = normalizeRadians(angle);
      if (event.shiftKey) angle = Math.round(angle / step) * step;
      callback(angle);
    });
  }

  let sweepFlag = Math.abs(spread) >= Math.PI ? 1 : 1;
  let largeArcFlag = Math.abs(spread) >= Math.PI ? 1 : 0;

  return (
    h("g", {},
      h("path", {
        d: `M ${cx} ${cy} L ${x0} ${y0} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${x1} ${y1} L ${cx} ${cy}`,
        fill: "rgba(0, 0, 255, 0.1)",
      }),
      h("path", {
        d: `M ${x0} ${y0} L ${cx} ${cy}`,
        fill: "none",
        stroke: "blue",
        strokeLinecap: "round",
      }),
      h("path", {
        d: `M ${x1} ${y1} L ${cx} ${cy}`,
        fill: "none",
        stroke: "red",
        strokeLinecap: "round",
      }),
      // This control point determines the "center" of the emitter
      h("circle", {
        cx: cx,
        cy: cy,
        r: 2,
        fill: "white",
        stroke: "blue",
        style: { cursor: "grab" },
        onPointerDown: createDragHandler((x, y) => setCenter({ x, y })),
      }),
      // This control point determines the "angle" of the emitter
      h("circle", {
        cx: x0,
        cy: y0,
        r: 2,
        fill: "white",
        stroke: "blue",
        style: { cursor: "grab" },
        onPointerDown: createAngleDragHandler(setAngle),
      }),
      // This control point determines the "spread" of the emitter
      h("circle", {
        cx: x1,
        cy: y1,
        r: 2,
        fill: "white",
        stroke: "red",
        style: { cursor: "grab" },
        onPointerDown: createAngleDragHandler(rawAngle => {
          let spread = normalizeRadians(rawAngle - angle);
          setSpread(spread);
        }),
      }),
      h("rect", {
        x: x0 + 4,
        y: y0 - 4,
        width: 14,
        height: 8,
        fill: "blue",
        rx: 2,
      }),
      h("text", {
        x: x0 + 11,
        y: y0,
        "font-family": "monospace",
        "font-size": 5,
        "font-weight": "bold",
        "dominant-baseline": "middle",
        "text-anchor": "middle",
        "fill": "white",
        style: { pointerEvents: "none", userSelect: "none" },
      }, `${Math.round(radiansToDegrees(angle))}°`),
      h("rect", {
        x: x1 + 4,
        y: y1 - 4,
        width: 14,
        height: 8,
        fill: "red",
        rx: 2,
      }),
      h("text", {
        x: x1 + 11,
        y: y1,
        "font-family": "monospace",
        "font-weight": "bold",
        "font-size": 5,
        "dominant-baseline": "middle",
        "text-anchor": "middle",
        "fill": "white",
        style: { pointerEvents: "none", userSelect: "none" },
      }, `${Math.round(radiansToDegrees(spread))}°`),
    )
  )
};

/**
 * @type {Islands.Preact}
 */
export function AnglesExample() {
  let emitter = useMemo(
    () =>
      new ParticleEmitter({
        x: 50,
        y: 50,
        frequency: 10,
        velocity: [50, 10],
        angle: [0, Math.PI / 2],
        lifetime: [5, 3],
        sprites: [sprites.blue_circle],
      }),
    [],
  );

  let system = useParticles(() => [emitter]);
  let forceUpdate = useForceUpdate();

  return h(
    "div",
    { style: { display: "flex", alignItems: "center" } },
    h(
      Canvas,
      { system },
      h(
        "svg",
        { width: 300, height: 300, viewBox: "0 0 100 100" },
        h(ArcControls, { emitter, system, onUpdate: forceUpdate }),
      ),
    ),
    h(
      "pre",
      { readOnly: true },
      h("span", null, `new ParticleEmitter({\n`),
      `  angle: [`,
      h("span", { style: { color: "blue" } }, formatRadians(emitter.angle[0])),
      `, `,
      h("span", { style: { color: "red" } }, formatRadians(emitter.angle[1])),
      `],\n`,
      `});`
    )
  );
}
