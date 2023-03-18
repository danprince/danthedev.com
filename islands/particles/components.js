import { createContext, h } from "preact";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { isBrowser, onVisibilityChange } from "../helpers.js";
import { degreesToRadians, formatDegrees, normalizeRadians, roundToNearest } from "./helpers.js";
import { ParticleSystem, ParticleEmitter } from "./particles.js";

function useForceUpdate() {
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

  useEffect(() => {
    onVisibilityChange(system.canvas, {
      onVisible: () => system.start(),
      onHidden: () => system.stop(),
    })
  }, [system]);

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
 * @param {preact.ComponentChildren} [props.children]
 */
export function Canvas({ children, ...props }) {
  let system = useParticleSystem();
  /**
   * @type {preact.RefObject<SVGSVGElement>}
   */
  let svgRef = useRef(null);

  useEffect(() => {
    const { current: svg } = svgRef;
    if (!svg) return;

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

    svg.addEventListener("pointermove", onPointerMove);
    svg.addEventListener("pointerdown", onPointerDown);
    svg.addEventListener("pointerenter", onPointerEnter);
    svg.addEventListener("pointerleave", onPointerLeave);

    return () => {
      svg.removeEventListener("pointermove", onPointerMove);
      svg.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("blur", onPointerLeave);
    };
  }, [
    system,
    props.onPointerEnter,
    props.onPointerLeave,
    props.onPointerUp,
    props.onPointerDown,
  ]);

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
      ref: /** @type {any} */(svgRef),
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

  let hitRectWidth = 10;
  let hitRectHeight = 10;

  return (
    h("g", { class: "control-point" },
      h("rect", {
        class: "control-point-hit-rect",
        x: x - hitRectWidth / 2,
        y: y - hitRectHeight / 2,
        width: hitRectWidth,
        height: hitRectHeight,
        rx: 1,
        style: { cursor: "grab" },
        fill: color,
        opacity: 0,
        onPointerDown,
      }),
      h("circle", {
        class: "control-point-handle",
        cx: x,
        cy: y,
        r: 2,
        fill: background,
        stroke: color,
        "pointer-events": "none",
      }),
    )
  );
}

/**
 * @param {object} props
 * @param {number} props.x
 * @param {number} props.y
 * @param {string} props.color
 * @param {"left" | "right" | "up" | "down" | "center"} props.position
 * @param {any} props.value
 */
export function ControlLabel({ x, y, color, value, position = "center" }) {
  let text = `${value}`;
  let width = Math.max(8, text.length * 4);
  let height = 8;

  if (position === "left") {
    x -= width + 4;
    y -= height / 2;
  } else if (position === "right") {
    x += 4;
    y -= height / 2;
  } else if (position === "center") {
    x -= width / 2;
    y -= height / 2;
  } else if (position === "up") {
    x -= width / 2;
    y -= height + 4;
  } else if (position === "down") {
    x -= width / 2;
    y += 4;
  }

  return (
    h("g", {},
      h("rect", {
        x: x,
        y: y,
        width,
        height,
        fill: color,
        rx: 2,
      }),
      h(
        "text",
        {
          x: x + width / 2,
          y: y + height / 2,
          fill: "white",
          style: { pointerEvents: "none", userSelect: "none" },
        },
        text,
      ),
    )
  );
}

/**
 * @param {object} props
 * @param {ParticleEmitter} props.emitter
 * @param {(updates: Partial<ParticleEmitter>) => void} props.update
 */
export function PositionControls({ emitter, update }) {
  return h(
    "g",
    {},
    h("rect", {
      x: emitter.x,
      y: emitter.y,
      width: emitter.width,
      height: emitter.height,
      fill: "none",
      stroke: "blue",
    }),
    h(ControlPoint, {
      x: emitter.x,
      y: emitter.y,
      color: "blue",
      onMoved(x, y) {
        update({ x: Math.round(x), y: Math.round(y) });
      },
    }),
    h(ControlPoint, {
      x: emitter.x + emitter.width,
      y: emitter.y + emitter.height,
      color: "red",
      onMoved(x, y) {
        update({ width: Math.round(x - emitter.x), height: Math.round(y - emitter.y) });
      },
    }),
  );
}

/**
 * @param {object} props
 * @param {ParticleEmitter} props.emitter
 * @param {(updates: Partial<ParticleEmitter>) => void} props.update
 */
export function AngleControls({ emitter, update }) {
  // Control points
  let cx = emitter.x;
  let cy = emitter.y;
  let radius = 30;
  let x0 = cx + Math.cos(emitter.angle) * radius;
  let y0 = cy + Math.sin(emitter.angle) * radius;
  let x1 = cx + Math.cos(emitter.angle + emitter.angleSpread) * radius;
  let y1 = cy + Math.sin(emitter.angle + emitter.angleSpread) * radius;

  /**
   * @param {number} x
   * @param {number} y
   */
  function angleFromCenter(x, y) {
    return Math.atan2(y - cy, x - cx);
  }

  let sweepFlag = Math.abs(emitter.angleSpread) >= Math.PI ? 1 : 1;
  let largeArcFlag = Math.abs(emitter.angleSpread) >= Math.PI ? 1 : 0;

  return h(
    "g",
    {},
    h("path", {
      d: `M ${cx} ${cy} L ${x0} ${y0} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${x1} ${y1} L ${cx} ${cy}`,
      fill: "blue",
      opacity: 0.1,
    }),
    h("path", {
      d: `M ${x0} ${y0} A ${radius} ${radius} 0 ${largeArcFlag ? 0 : 1} ${
        sweepFlag ? 0 : 1
      } ${x1} ${y1}`,
      stroke: "blue",
      fill: "none",
      opacity: 0.4,
      "stroke-dasharray": "2 4",
    }),
    h("path", {
      d: `M ${x0} ${y0} L ${cx} ${cy}`,
      fill: "none",
      stroke: "blue",
    }),
    h("path", {
      d: `M ${x1} ${y1} L ${cx} ${cy}`,
      fill: "none",
      stroke: "red",
    }),
    // This control point determines the "angle" of the emitter
    h(ControlPoint, {
      x: x0,
      y: y0,
      color: "blue",
      onMoved: (x, y, event) =>
        update({
          angle: roundToNearest(
            normalizeRadians(angleFromCenter(x, y)),
            degreesToRadians(event.shiftKey ? 10 : 1),
          ),
        }),
    }),
    // This control point determines the "spread" of the emitter
    h(ControlPoint, {
      x: x1,
      y: y1,
      color: "red",
      onMoved: (x, y, event) =>
        update({
          angleSpread: roundToNearest(
            normalizeRadians(angleFromCenter(x, y) - emitter.angle),
            degreesToRadians(event.shiftKey ? 10 : 1),
          ),
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
    h(
      "text",
      {
        x: x0 + 11,
        y: y0 + 1,
        fill: "white",
        style: { pointerEvents: "none", userSelect: "none" },
      },
      formatDegrees(emitter.angle),
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
      formatDegrees(emitter.angleSpread),
    ),
  );
};

/**
 * @param {object} props
 * @param {preact.ComponentChildren} [props.children]
 */
export function CodeExample({ children }) {
  return h("pre", { readOnly: true, children });
}

/**
 * @template Value
 * @typedef {object} InteractiveProperty
 * @property {string} name
 * @property {string} color
 * @property {Value} value
 * @property {(value: Value) => void} update
 */

/**
 * @template {InteractiveProperty<any>[]} Properties
 * @param {object} props
 * @param {Properties} props.properties
 */
export function InteractiveObject({ properties }) {
  return h(CodeExample, null,
    `{ `,
    ...properties.flatMap((property, index) => [
      `${property.name}: `,
      h(CodeInput, {
        value: property.value,
        color: property.color,
        onChange: property.update,
      }),
      // Skip trailing commas
      index < properties.length - 1 ? ", " : "",
    ]),
    ` }`,
  );
}

/**
 * @param {object} props
 * @param {number} props.value
 * @param {number} props.x
 * @param {number} props.y
 * @param {number} props.width
 * @param {number} props.min
 * @param {number} props.max
 * @param {number} props.step
 * @param {string} props.color
 * @param {(newValue: number) => void} props.onUpdate
 */
export function HorizontalSlider(props) {
  let percent = (props.value - props.min) / (props.max - props.min);
  let x = props.x + percent * props.width;

  return (
    h("g", null,
      h("line", {
        x1: props.x,
        y1: props.y,
        x2: props.x + props.width,
        y2: props.y,
        stroke: props.color,
      }),
      h(ControlLabel, {
        x,
        y: props.y,
        value: props.value,
        color: "blue",
        position: "up",
      }),
      h(ControlPoint, {
        x,
        y: props.y,
        color: props.color,
        onMoved: (x, y) => {
          let percent = (x - props.x) / props.width;
          let newValue = props.min + percent * (props.max - props.min);
          let clamped = Math.min(Math.max(props.min, newValue), props.max);
          let stepped = roundToNearest(clamped, props.step);
          props.onUpdate(stepped);
        }
      })
    )
  );
}

/**
 * @param {object} props
 * @param {ParticleEmitter} props.emitter
 * @param {(updates: Partial<ParticleEmitter>) => void} props.update
 */
export function VelocityControls({ emitter, update }) {
  return h(
    "g",
    {},
    h("line", {
      x1: emitter.x,
      y1: emitter.y + 10,
      x2: emitter.x + emitter.velocity,
      y2: emitter.y + 10,
      stroke: "blue",
    }),
    h("line", {
      x1: emitter.x + emitter.velocity,
      y1: emitter.y + 10,
      x2: emitter.x + emitter.velocity + emitter.velocitySpread,
      y2: emitter.y + 10,
      stroke: "red",
    }),
    h(ControlLabel, {
      x: emitter.x + emitter.velocity,
      y: emitter.y + 10,
      color: "blue",
      value: emitter.velocity,
      position: "down",
    }),
    h(ControlLabel, {
      x: emitter.x + emitter.velocity + emitter.velocitySpread,
      y: emitter.y + 10,
      color: "red",
      value: emitter.velocitySpread,
      position: "down",
    }),
    h(ControlPoint, {
      x: emitter.x + emitter.velocity,
      y: emitter.y + 10,
      color: "blue",
      onMoved: x => update({ velocity: roundToNearest(x - emitter.x, 1) }),
    }),
    h(ControlPoint, {
      x: emitter.x + emitter.velocity + emitter.velocitySpread,
      y: emitter.y + 10,
      color: "red",
      onMoved: x =>
        update({
          velocitySpread: roundToNearest(x - emitter.velocity - emitter.x, 1),
        }),
    }),
  );
}

/**
 * @param {object} props
 * @param {ParticleEmitter} props.emitter
 * @param {(updates: Partial<ParticleEmitter>) => void} props.update
 */
export function MassControls({ emitter, update }) {
  let x1 = emitter.x;
  let y1 = emitter.y;
  let x2 = emitter.x;
  let y2 = emitter.y + emitter.mass;
  let x3 = emitter.x;
  let y3 = emitter.y + emitter.mass + emitter.massSpread;

  return h(
    "g",
    {},
    h("line", { x1, y1, x2, y2, stroke: "blue" }),
    h("line", {
      x1: x2,
      y1: y2,
      x2: x3,
      y2: y3,
      stroke: "red",
    }),
    h(ControlLabel, {
      x: x2,
      y: y2,
      color: "blue",
      value: emitter.mass,
      position: "left",
    }),
    h(ControlLabel, {
      x: x3,
      y: y3,
      color: "red",
      value: emitter.massSpread,
      position: "right",
    }),
    h(ControlPoint, {
      x: emitter.x,
      y: emitter.y + emitter.mass,
      color: "blue",
      onMoved: (x, y) => update({ mass: Math.round(y - emitter.y) }),
    }),
    h(ControlPoint, {
      x: emitter.x,
      y: emitter.y + emitter.mass + emitter.massSpread,
      color: "red",
      onMoved: (x, y) => update({ massSpread: Math.floor(y - emitter.mass - emitter.y) }),
    }),
  );
}

/**
 * @param {object} props
 * @param {any} props.value
 * @param {string} [props.color]
 * @param {(value: string) => any} [props.parse]
 * @param {(value: any) => void} props.onChange
 */
export function CodeInput({ value, parse = eval, color = "inherit", onChange }) {
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
      size: String(value).length,
      // @ts-ignore
      onBlur: event => onChange(parse(event.target.value) || 0),
    })
  );
}

/**
 * @param {object} props
 * @param {number} props.value
 * @param {string} [props.color]
 * @param {(value: string) => number} [props.parse]
 * @param {(value: number) => void} props.onChange
 */
export function CodeNumberInput({ parse = parseFloat, ...props }) {
  return h(CodeInput, { ...props, parse });
}
