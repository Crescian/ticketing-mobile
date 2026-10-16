import { useEffect, useState } from 'react';

// Re-renders every `ms` so countdowns stay current.
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function formatDuration(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const min = m % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${min}m`;
  return `${min}m`;
}

// "2h 15m left" / "Overdue 30m" from the SLA due time.
export function slaLabel(dueAt: string, now: number): { text: string; overdue: boolean } {
  const minutes = (new Date(dueAt).getTime() - now) / 60_000;
  return minutes >= 0 ? { text: `${formatDuration(minutes)} left`, overdue: false } : { text: `Overdue ${formatDuration(-minutes)}`, overdue: true };
}
