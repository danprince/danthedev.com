import { h } from "preact";
import { useState, useMemo } from "preact/hooks";
import { AngleControls, Canvas, CodeNumberInput, ParticleSystemProvider, useForceUpdate, VelocityControls } from "./components.js";
import { roundToFixed, formatRadians } from "./helpers.js";
import { ParticleEmitter, sprites } from "./particles.js";

/**
 * @param {string} text
 */
function comment(text) {
  return h("span", { class: "token comment" }, "// ", text);
}

/**
 * @type {Islands.Preact}
 */
export function RangeDemo() {
  let [range, setRange] = useState([25, 50]);
  let samples = 10;
  let [base, spread] = range;

  let values = useMemo(() => {
    return Array
      .from({ length: samples })
      .map(() => base + spread * Math.random());
  }, [samples, base, spread]);

  return h(
    "div",
    {},
    h(
      "pre",
      null,
      "sample10([",
      h(CodeNumberInput, {
        value: base,
        color: "blue",
        onChange: value => setRange([value, spread]),
      }),
      ", ",
      h(CodeNumberInput, {
        value: spread,
        color: "red",
        onChange: value => setRange([base, value]),
      }),
      "]); ",
      comment("<- these values are editable!"),
      "\n",
      comment(`generates values between ${base} and ${base + spread}`),
      "\n",
      comment(JSON.stringify(values.map(v => roundToFixed(v, 2))).replace(/,/g, ", ")),
    ),
  );
}

/**
 * @type {Islands.Preact}
 */
export function VelocityDemo() {
  let emitter = useMemo(
    () =>
      new ParticleEmitter({
        x: 10,
        y: 50,
        frequency: 3,
        velocity: [50, 0],
        angle: [0, 0],
        lifetime: [3, 0],
        sprites: [sprites.blue_circle],
      }),
    [],
  );

  return h(
    ParticleSystemProvider,
    { emitters: [emitter] },
    h(
      "div",
      { style: { display: "flex", alignItems: "center" } },
      h(Canvas, {}, h(VelocityControls, { emitter })),
      h(
        "pre",
        { readOnly: true },
        h("span", null, `new ParticleEmitter({\n`),
        `  velocity: [`,
        h(
          "span",
          { style: { color: "blue" } },
          formatRadians(emitter.velocity[0]),
        ),
        `, `,
        h(
          "span",
          { style: { color: "red" } },
          formatRadians(emitter.velocity[1]),
        ),
        `],\n`,
        `});`,
      ),
    ),
  );
}

/**
 * @type {Islands.Preact}
 */
export function AngleDemo() {
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

  let forceUpdate = useForceUpdate();

  return h(
    ParticleSystemProvider,
    { emitters: [emitter] },
    h(
      "div",
      { style: { display: "flex", alignItems: "center" } },
      h(Canvas, {}, h(AngleControls, { emitter })),
      h(
        "pre",
        { readOnly: true },
        h("span", null, `new ParticleEmitter({\n`),
        `  angle: [`,
        h(
          "span",
          { style: { color: "blue" } },
          formatRadians(emitter.angle[0]),
        ),
        `, `,
        h("span", { style: { color: "red" } }, formatRadians(emitter.angle[1])),
        `],\n`,
        `});`,
      ),
    ),
  );
}
