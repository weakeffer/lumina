import { useState, useEffect } from 'react';

/**
 * Хук для debounce значений
 * @param {any} value - значение для debounce
 * @param {number} delay - задержка в мс
 * @returns {any} - debounced значение
 * 
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 * // API вызов с debouncedSearch
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};