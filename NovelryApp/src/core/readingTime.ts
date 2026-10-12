import { localParts, startOfLocalDay } from './localTime';
import type { ReadingSession } from './storage/storage';

export type ReadingTime = {
  /** Seconds read today. */
  today: number;
  /** Seconds read this week (weeks start on Monday). */
  thisWeek: number;
  /** Seconds read this year. */
  thisYear: number;
};

/** Seconds of the period [from, to) during which at least one session was running. Overlaps count once. */
function secondsRead(sessions: ReadingSession[], from: number, to: number, now: number): number {
  const intervals = sessions
    .map((session) => [
      Math.max(Date.parse(session.startedAt), from),
      Math.min(session.endedAt ? Date.parse(session.endedAt) : now, to),
    ])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let coveredUntil = -Infinity;
  for (const [start, end] of intervals) {
    const effectiveStart = Math.max(start, coveredUntil);
    if (end > effectiveStart) {
      total += end - effectiveStart;
      coveredUntil = end;
    }
  }
  return Math.round(total / 1000);
}

/**
 * Reading time today, this week and this year, as the Reader's calendar sees it
 * (days change at local midnight). A session that crosses midnight is split between the days;
 * a session still running counts up to `now`.
 */
export function readingTime(sessions: ReadingSession[], now: Date, timeZone: string): ReadingTime {
  const nowMs = now.getTime();
  const { year, month, day } = localParts(nowMs, timeZone);

  const todayStart = startOfLocalDay(year, month, day, timeZone);
  const tomorrowStart = startOfLocalDay(year, month, day + 1, timeZone);

  const daysSinceMonday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
  const weekStart = startOfLocalDay(year, month, day - daysSinceMonday, timeZone);
  const nextWeekStart = startOfLocalDay(year, month, day - daysSinceMonday + 7, timeZone);

  const yearStart = startOfLocalDay(year, 1, 1, timeZone);
  const nextYearStart = startOfLocalDay(year + 1, 1, 1, timeZone);

  return {
    today: secondsRead(sessions, todayStart, tomorrowStart, nowMs),
    thisWeek: secondsRead(sessions, weekStart, nextWeekStart, nowMs),
    thisYear: secondsRead(sessions, yearStart, nextYearStart, nowMs),
  };
}
