import { createContext, h } from "preact";
import { useCallback, useContext, useEffect, useMemo, useState } from "preact/hooks";
import { isBrowser } from "../helpers.js";
import { degreesToRadians, normalizeRadians, radiansToDegrees, roundToNearest } from "./helpers.js";
import { ParticleSystem, ParticleEmitter } from "./particles.js";

export function useForceUpdate() {
  let [_, setState] = useState([]);
  return useCallback(() => setState([]), [setState]);
}

let ParticleSystemContext = createContext(new ParticleSystem());

export let useParticleSystem = () => useContext(ParticleSystemContext);

/**
 * @param {ConstructorParameters<typeof ParticleEmitter>[0]} options
 * @returns {[ParticleEmitter, (updates: Partial<ParticleEmitter>) => void]}
 */
export let useEmitter = (options) => {
  let emitter = useMemo(() => new ParticleEmitter(options), []);
  let forceUpdate = useForceUpdate();
  let update = useCallback(
    /**
     * @param {Partial<ParticleEmitter>} options
     */
    options => {
      Object.assign(emitter, options);
      forceUpdate();
    },
    [forceUpdate],
  );
  return [emitter, update];
}

/**
 * @param {object} props
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {preact.ComponentChildren} [props.children]
 * @param {ParticleEmitter[]} [props.emitters]
 * @param {() => void} [props.onUpdate]
 */
export function ParticleSystemProvider({
  children,
  width,
  height,
  emitters = [],
}) {
  let system = useMemo(
    () => new ParticleSystem({ width, height, emitters }),
    [width, height, ...emitters],
  );

  return h(ParticleSystemContext.Provider, {
    value: system,
    children,
  });
}

/**
 * @param {object} props
 * @param {(x: number, y: number) => void} [props.onPointerMove]
 * @param {(x: number, y: number) => void} [props.onPointerDown]
 * @param {(x: number, y: number) => void} [props.onPointerUp]
 * @param {() => void} [props.onPointerEnter]
 * @param {() => void} [props.onPointerLeave]
 * @param {import("preact").ComponentChildren} [props.children]
 */
export function Canvas({ children, ...props }) {
  let system = useParticleSystem();

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

  let { width, height } = system.canvas;

  return h(
    "div",
    {
      class: "canvas",
      ref: system.mount,
      style: {
        position: "relative",
        width: width * system.scale,
        height: height * system.scale,
      },
    },
    h("svg", {
      class: "canvas-controls",
      width: width * system.scale,
      height: height * system.scale,
      viewBox: `0 0 ${width} ${height}`,
      style: { position: "absolute", top: 0, left: 0, userSelect: "none" },
      children,

      // SVG defaults
      "font-family": "monospace",
      "font-weight": "bold",
      "font-size": 5,
      "dominant-baseline": "middle",
      "text-anchor": "middle",
      "stroke-linecap": "round",
    }),
  );
}

/**
 * @param {object} props
 * @param {number} props.x
 * @param {number} props.y
 * @param {string} props.color
 * @param {(x: number, y: number, event: PointerEvent) => void} props.onMoved
 */
export function ControlPoint({ x, y, color, onMoved }) {
  let system = useParticleSystem();

  let onPointerDown = useCallback(() => {
    /**
     * @param {PointerEvent} event
     */
    function onPointerMove(event) {
      let [x, y] = system.mapCoords(event.clientX, event.clientY);
      onMoved(x, y, event);
    }

    function onPointerUp() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }, [onMoved]);

  // TODO: This doesn't work with hydration. Why not?
  let background = isBrowser
    ? window.getComputedStyle(document.body).backgroundColor
    : "white";

  return (
    h("circle", {
      cx: x,
      cy: y,
      r: 2,
      fill: background,
      stroke: color,
      style: { cursor: "grab" },
      onPointerDown,
    })
  );
}

/**
 * @param {object} props
 * @param {ParticleEmitter} props.emitter
 * @param {(updates: Partial<ParticleEmitter>) => void} props.update
 */
export function AngleControls({ emitter, update }) {
  let [base, spread] = emitter.angle;

  // Control points
  let cx = emitter.x;
  let cy = emitter.y;
  let radius = 30;
  let x0 = cx + Math.cos(base) * radius;
  let y0 = cy + Math.sin(base) * radius;
  let x1 = cx + Math.cos(base + spread) * radius;
  let y1 = cy + Math.sin(base + spread) * radius;

  /**
   * @param {number} value
   */
  function setBase(value) {
    update({ angle: [value, spread] });
  }

  /**
   * @param {number} value
   */
  function setSpread(value) {
    update({ angle: [base, value] });
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  function angleFromCenter(x, y) {
    return Math.atan2(y - cy, x - cx);
  }

  let sweepFlag = Math.abs(spread) >= Math.PI ? 1 : 1;
  let largeArcFlag = Math.abs(spread) >= Math.PI ? 1 : 0;

  return h(
    "g",
    {},
    h("path", {
      d: `M ${cx} ${cy} L ${x0} ${y0} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${x1} ${y1} L ${cx} ${cy}`,
      fill: "blue",
      opacity: 0.1,
    }),
    h("path", {
      d: `M ${x0} ${y0} L ${cx} ${cy}`,
      fill: "none",
      stroke: "blue",
      opacity: 0.5,
    }),
    h("path", {
      d: `M ${x1} ${y1} L ${cx} ${cy}`,
      fill: "none",
      stroke: "red",
      opacity: 0.5,
    }),
    // This control point determines the "angle" of the emitter
    h(ControlPoint, {
      x: x0,
      y: y0,
      color: "blue",
      onMoved: (x, y, event) =>
        setBase(
          roundToNearest(
            normalizeRadians(angleFromCenter(x, y)),
            degreesToRadians(event.shiftKey ? 10 : 1),
          ),
        ),
    }),
    // This control point determines the "spread" of the emitter
    h(ControlPoint, {
      x: x1,
      y: y1,
      color: "red",
      onMoved: (x, y, event) =>
        setSpread(
          roundToNearest(
            normalizeRadians(angleFromCenter(x, y) - base),
            degreesToRadians(event.shiftKey ? 10 : 1),
          ),
        ),
    }),
    h("rect", {
      x: x0 + 4,
      y: y0 - 4,
      width: 14,
      height: 8,
      fill: "blue",
      rx: 2,
    }),
    h(
      "text",
      {
        x: x0 + 11,
        y: y0 + 1,
        fill: "white",
        style: { pointerEvents: "none", userSelect: "none" },
      },
      `${Math.round(radiansToDegrees(base))}°`,
    ),
    h("rect", {
      x: x1 + 4,
      y: y1 - 4,
      width: 14,
      height: 8,
      fill: "red",
      rx: 2,
    }),
    h(
      "text",
      {
        x: x1 + 11,
        y: y1,
        fill: "white",
        style: { pointerEvents: "none", userSelect: "none" },
      },
      `${Math.round(radiansToDegrees(spread))}°`,
    ),
  );
};

/**
 * @param {object} props
 * @param {ParticleEmitter} props.emitter
 * @param {(updates: Partial<ParticleEmitter>) => void} props.update
 */
export function VelocityControls({ emitter, update }) {
  let [base, spread] = emitter.velocity;

  return (
    h("g", {},
      h("line", {
        x1: emitter.x,
        y1: emitter.y + 10,
        x2: emitter.x + base,
        y2: emitter.y + 10,
        stroke: "blue",
        opacity: 0.5,
      }),
      h("line", {
        x1: emitter.x + base,
        y1: emitter.y + 10,
        x2: emitter.x + base + spread,
        y2: emitter.y + 10,
        stroke: "red",
        opacity: 0.5,
      }),
      h(ControlPoint, {
        x: emitter.x + base,
        y: emitter.y + 10,
        color: "blue",
        onMoved: x => update({ velocity: [x - emitter.x, spread] }),
      }),
      h(ControlPoint, {
        x: emitter.x + base + spread,
        y: emitter.y + 10,
        color: "red",
        onMoved: x => update({ velocity: [base, (x - base - emitter.x)] }),
      }),
    )
  );
}

/**
 * @param {object} props
 * @param {number} props.value
 * @param {string} [props.color]
 * @param {(value: string) => number} [props.parse]
 * @param {(value: number) => void} props.onChange
 */
export function CodeNumberInput({ value, parse = parseFloat, color = "inherit", onChange }) {
  /**
   * @type {import("preact/compat").CSSProperties}
   */
  let style = {
    background: "none",
    border: 0,
    color: color,
    fontSize: "inherit",
    fontFamily: "var(--mono)",
    fontWeight: "bold",
    textAlign: "right",
    outline: "none",
  };

  return (
    // @ts-ignore
    h("input", {
      type: "text",
      value: value,
      style,
      size: value.toString().length,
      // @ts-ignore
      onBlur: event => onChange(parse(event.target.value) || 0),
    })
  );
}
