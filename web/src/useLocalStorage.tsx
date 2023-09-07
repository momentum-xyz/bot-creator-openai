import { useEffect, useState } from 'react';

export const useLocalStorage = (storageKey: string, fallbackState: any) => {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '');
    } catch (_) {
      return fallbackState;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(value));
  }, [value, storageKey]);

  return [value, setValue];
};
