import { useEffect, useState } from "react";

// Works like useState, but the value is also saved in the browser's localStorage.
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage can be full or blocked; the app still works without it
    }
  }, [key, value]);

  return [value, setValue] as const;
}