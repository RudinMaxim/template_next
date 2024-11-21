'use client';
import { useEffect, useState, useRef } from 'react';

export const useThrottle = <T>(value: T, delay = 500) => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = window.setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, delay);

    return () => window.clearTimeout(handler);
  }, [value, delay]);

  return throttledValue;
};
