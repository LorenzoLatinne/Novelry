import type { ReadingSession } from './storage/storage';

export type ReadingTime = {
  /** Seconds read today. */
  today: number;
  /** Seconds read this week (weeks start on Monday). */
  thisWeek: number;
  /** Seconds read this year. */
  thisYear: number;
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

function localParts(instant: number, timeZone: string) {
  const parts = formatterFor(timeZone).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24, // some engines report midnight as 24
    minute: get('minute'),
    second: get('second'),
  };
}

/** How far the time zone is ahead of UTC at an instant, in milliseconds. */
function offsetAt(instant: number, timeZone: string): number {
  const p = localParts(instant - (instant % 1000), timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - (instant - (instant % 1000));
}

/** The instant at which a calendar day begins in a time zone. Months are 1-12; days may overflow. */
function startOfLocalDay(year: number, month: number, day: number, timeZone: string): number {
  const asIfUtc = Date.UTC(year, month - 1, day);
  const first = asIfUtc - offsetAt(asIfUtc, timeZone);
  return asIfUtc - offsetAt(first, timeZone);
}

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
