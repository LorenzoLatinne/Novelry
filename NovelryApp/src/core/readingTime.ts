import type { ReadingSession } from './storage/storage';

export type ReadingTime = {
  /** Seconds read today. */
  today: number;
  /** Seconds read this week (weeks start on Monday). */
  thisWeek: number;
  /** Seconds read this year. */
  thisYear: number;
};

function localParts(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
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

function overlapSeconds(sessions: ReadingSession[], from: number, to: number, now: number): number {
  let total = 0;
  for (const session of sessions) {
    const start = Date.parse(session.startedAt);
    const end = session.endedAt ? Date.parse(session.endedAt) : now;
    total += Math.max(0, Math.min(end, to) - Math.max(start, from));
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
    today: overlapSeconds(sessions, todayStart, tomorrowStart, nowMs),
    thisWeek: overlapSeconds(sessions, weekStart, nextWeekStart, nowMs),
    thisYear: overlapSeconds(sessions, yearStart, nextYearStart, nowMs),
  };
}
