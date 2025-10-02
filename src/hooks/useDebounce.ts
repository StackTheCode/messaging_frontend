// hooks/useDebounce.ts
import { useCallback, useEffect, useRef } from "react";

type Timer = ReturnType<typeof setTimeout> | null;

export const useDebounce = <T extends unknown[], R>(
  callback: (...args: T) => Promise<R> | R,
  delay: number
) => {
  const timeoutRef = useRef<Timer>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: T): Promise<R> =>
      new Promise((resolve) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(async () => {
          const result = await callbackRef.current(...args);
          resolve(result);
        }, delay);
      }),
    [delay]
  );
};
