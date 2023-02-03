import type { FC } from "preact/compat";
import { useState } from "preact/hooks";

export let Counter: FC<{ value?: number }> = ({ value = 0 }) => {
  let [count, setCount] = useState(value);

  return (
    <button
      onClick={() => setCount(count + 1)}
      class="bg-gray-200 rounded border-0"
    >
      {count}
    </button>
  );
};

export default Counter;
