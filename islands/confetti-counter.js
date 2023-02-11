import { h } from "preact";
import { useState } from "preact/hooks";

export let ConfettiCounter = ({ value = 0 }) => {
  let [count, setCount] = useState(value);

  async function increment() {
    setCount(count + 1);
    let confetti = await import("https://esm.sh/canvas-confetti@1.6.0");
    confetti.default();
  }

  return (
    h("button", { onClick: increment }, count)
  );
}

export default ConfettiCounter;
