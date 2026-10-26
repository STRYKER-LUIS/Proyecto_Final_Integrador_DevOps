import { useEffect, useState } from 'react';

/**
 * Devuelve la hora actual y la actualiza periódicamente para que los
 * contadores de SLA y los tiempos relativos no queden congelados.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
