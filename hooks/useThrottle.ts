import {useCallback, useRef} from "react";

export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
) {
  const lastRun = useRef(Date.now());

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    // delay 시간이 지났으면 실행
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }, [callback, delay]);
}