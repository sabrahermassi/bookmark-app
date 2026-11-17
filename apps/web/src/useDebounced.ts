import { useState, useEffect } from "react";

// Returns `value`, but only after it has stopped changing for `delayMs`.
// Generic: works for text, numbers, objects…
export function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // Copy the value after the delay. A new value runs the cleanup first,
    // which cancels this timer, so only the last value gets through.
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
