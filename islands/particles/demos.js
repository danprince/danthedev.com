import { h } from "preact";
import { useState, useMemo } from "preact/hooks";
import { AngleControls, Canvas, CodeInput, HorizontalSlider, InteractiveObject, MassControls, ParticleSystemProvider, PositionControls, useEmitter, VelocityControls } from "./components.js";
import { roundToFixed, formatRadians } from "./helpers.js";
import { sprites } from "./particles.js";

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
  let [base, setBase] = useState(25);
  let [spread, setSpread] = useState(25);
  let samples = 10;

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
      "sample({ base: ",
      h(CodeInput, {
        value: base,
        color: "blue",
        onChange: setBase,
      }),
      ", spread: ",
      h(CodeInput, {
        value: spread,
        color: "red",
        onChange: setSpread,
      }),
      " }); ",
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
export function VelocityDemo({ base = 50, spread = 0 }) {
  let [emitter, update] = useEmitter({
    x: 10,
    y: 5,
    frequency: 1,
    velocity: base,
    velocitySpread: spread,
    life: 3,
    variants: [[sprites.blue_circle]],
  });

  return h(
    ParticleSystemProvider,
    { height: 30, emitters: [emitter] },
    h(
      "div",
      { style: { display: "flex", alignItems: "center", flexDirection: "column" } },
      h(Canvas, {}, h(VelocityControls, { emitter, update })),
      h(InteractiveObject, {
        properties: [
          {
            name: "velocity",
            value: emitter.velocity,
            color: "blue",
            update: velocity => update({ velocity }),
          },
          {
            name: "velocitySpread",
            value: emitter.velocitySpread,
            color: "red",
            update: velocitySpread => update({ velocitySpread }),
          }
        ],
      }),
    )
  );
}

/**
 * @type {Islands.Preact}
 */
export function AngleDemo() {
  let [emitter, update] = useEmitter({
    x: 50,
    y: 50,
    frequency: 5,
    velocity: 50,
    velocitySpread: 10,
    angleSpread: Math.PI / 2,
    life: 5,
    variants: [[sprites.blue_circle]],
  });

  return h(
    ParticleSystemProvider,
    { emitters: [emitter] },
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
        },
      },
      h(Canvas, {}, h(AngleControls, { emitter, update })),
      h(InteractiveObject, {
        properties: [
          {
            name: "angle",
            color: "blue",
            value: formatRadians(emitter.angle),
            update: angle => update({ angle }),
          },
          {
            name: "angleSpread",
            color: "red",
            value: formatRadians(emitter.angleSpread),
            update: angleSpread => update({ angleSpread }),
          },
        ]
      }),
    ),
  );
}

/**
 * @type {Islands.Preact}
 */
export function MassDemo({ base = 30, spread = 0 }) {
  let [emitter, update] = useEmitter({
    x: 20,
    y: 50,
    frequency: 5,
    velocity: 50,
    life: 3,
    mass: base,
    massSpread: spread,
    variants: [[sprites.blue_circle]],
  });

  return h(
    ParticleSystemProvider,
    { emitters: [emitter] },
    h(
      "div",
      {
        onClick: () => emitter.emit(),
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        },
      },
      h(Canvas, {}, h(MassControls, { emitter, update })),
      h(InteractiveObject, {
        properties: [
          {
            name: "mass",
            color: "blue",
            value: emitter.mass,
            update: mass => update({ mass }),
          },
          {
            name: "massSpread",
            color: "red",
            value: emitter.massSpread,
            update: massSpread => update({ massSpread }),
          },
        ]
      }),
    ),
  );
}

/**
 * @type {Islands.Preact}
 */
export function PositionDemo({ x = 25, y = 25, width = 50, height = 50 }) {
  let [emitter, update] = useEmitter({
    x,
    y,
    width,
    height,
    frequency: 5,
    velocity: 3,
    angleSpread: Math.PI * 2,
    life: 3,
    variants: [[sprites.blue_circle]],
  });

  return h(
    ParticleSystemProvider,
    { emitters: [emitter] },
    h(
      "div",
      {
        onClick: () => emitter.emit(),
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        },
      },
      h(Canvas, {}, h(PositionControls, { emitter, update })),
      h(InteractiveObject, {
        properties: [
          {
            name: "x",
            color: "blue",
            value: emitter.x,
            update: x => update({ x }),
          },
          {
            name: "y",
            color: "blue",
            value: emitter.y,
            update: y => update({ y }),
          },
          {
            name: "width",
            color: "red",
            value: emitter.width,
            update: width => update({ width }),
          },
          {
            name: "height",
            color: "red",
            value: emitter.height,
            update: height => update({ height }),
          },
        ]
      }),
    ),
  );
}

/**
 * @type {Islands.Preact}
 */
export function FrequencyDemo() {
  let [emitter, update] = useEmitter({
    x: 50,
    y: 50,
    frequency: 10,
    velocity: 10,
    angleSpread: Math.PI * 2,
    life: 3,
    variants: [[sprites.blue_circle]],
  });

  return h(
    ParticleSystemProvider,
    { emitters: [emitter] },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        },
      },
      h(Canvas, {},
        h(HorizontalSlider, {
          x: 10,
          y: 95,
          width: 80,
          min: 0,
          max: 200,
          color: "blue",
          value: emitter.frequency,
          step: 1,
          onUpdate: frequency => update({ frequency }),
        })
      ),
      h(InteractiveObject, {
        properties: [
          {
            name: "frequency",
            color: "blue",
            value: emitter.frequency,
            update: frequency => update({ frequency }),
          },
        ]
      }),
    ),
  );
}

/**
 * @type {Islands.Preact}
 */
export function BurstDemo() {
  let [count, setCount] = useState(5);

  let [emitter] = useEmitter({
    x: 50,
    y: 50,
    frequency: 0,
    velocity: 10,
    angleSpread: Math.PI * 2,
    life: 3,
    variants: [[sprites.blue_circle]],
  });

  /**
   * @param {number} x
   * @param {number} y
   */
  function burst(x, y) {
    emitter.x = x;
    emitter.y = y;
    for (let i = 0; i < count; i++) {
      emitter.emit();
    }
  }

  return h(
    ParticleSystemProvider,
    { emitters: [emitter] },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        },
      },
      h(Canvas, { onPointerDown: burst },
        h(HorizontalSlider, {
          x: 10,
          y: 95,
          width: 80,
          min: 0,
          max: 50,
          color: "blue",
          value: count,
          step: 1,
          onUpdate: setCount,
        })
      ),
      h(InteractiveObject, {
        properties: [
          {
            name: "count",
            color: "blue",
            value: count,
            update: setCount,
          },
        ]
      }),
    ),
  );
}

/**
 * @type {Islands.Preact}
 */
export function SpriteDemo() {
  let [emitter] = useEmitter({
    x: 50,
    y: 90,
    frequency: 10,
    velocity: 20,
    velocitySpread: -5,
    mass: 5,
    angle: Math.PI * 1.5 - 0.2,
    angleSpread: 0.4,
    life: 3,
    variants: [[
      sprites.smoke_1,
      sprites.smoke_2,
      sprites.smoke_3,
      sprites.smoke_4,
    ], [
      sprites.smoke_3,
      sprites.smoke_4,
    ]],
  });

  return h(
    ParticleSystemProvider,
    { emitters: [emitter] },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        },
      },
      h(Canvas, null),
    ),
  );
}
