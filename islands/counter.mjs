import { h } from "preact";
import { useState } from "preact/hooks";

export default ({ value = 0 }) => {
  let [count, setCount] = useState(value);

  return (
    h("button", {
      onClick: () => setCount(count + 1)
    }, count)
  );
}
