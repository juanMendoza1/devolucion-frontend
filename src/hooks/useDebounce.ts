import { useState, useEffect } from 'react';

// Este hook retrasa la actualización de un valor hasta que pasen X milisegundos 
// desde la última vez que el usuario escribió algo.
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configuramos un temporizador
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiamos el temporizador si el valor cambia antes de que pase el tiempo
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}