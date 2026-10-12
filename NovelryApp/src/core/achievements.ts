import { localParts, startOfLocalDay } from './localTime';
import { secondsRead } from './readingTime';
import type { ReadingSession, Storage } from './storage/storage';
import type { Finish } from './yearlyGoal';

/** What Achievements are worked out from: the Reader's finished Books and Reading Sessions. */
export type AchievementHistory = {
  finishes: Finish[];
  sessions: ReadingSession[];
};

/**
 * One kind of Achievement. `measure` says how far along the Reader is, in the rule's own unit; the
 * Achievement is earned once it reaches `target`. Adding a rule to the list is all that adding an
 * Achievement takes: nothing about them is stored, so there is nothing to migrate.
 */
export type AchievementRule = {
  id: string;
  title: string;
  description: string;
  target: number;
  measure: (history: AchievementHistory, now: Date, timeZone: string) => number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  /** Progress toward the target, never more than the target. */
  current: number;
  target: number;
  earned: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function differentBooksFinished({ finishes }: AchievementHistory): number {
  return new Set(finishes.map((finish) => finish.isbn)).size;
}

function minutesRead({ sessions }: AchievementHistory, now: Date): number {
  return Math.floor(secondsRead(sessions, -Infinity, Infinity, now.getTime()) / 60);
}

/** The Reader's calendar days (as day numbers) on which at least part of a session fell. */
function daysRead(sessions: ReadingSession[], now: Date, timeZone: string): Set<number> {
  const days = new Set<number>();
  for (const session of sessions) {
    const start = Date.parse(session.startedAt);
    const end = session.endedAt ? Date.parse(session.endedAt) : now.getTime();
    const first = localParts(start, timeZone);
    let day = Math.floor(Date.UTC(first.year, first.month - 1, first.day) / DAY_MS);
    for (;;) {
      days.add(day);
      const date = new Date(day * DAY_MS);
      const nextMidnight = startOfLocalDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate() + 1, timeZone);
      if (nextMidnight >= end) {
        break;
      }
      day += 1;
    }
  }
  return days;
}

/** The most days in a row on which the Reader read, ever. */
function longestStreak({ sessions }: AchievementHistory, now: Date, timeZone: string): number {
  const days = [...daysRead(sessions, now, timeZone)].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  days.forEach((day, index) => {
    run = index > 0 && day === days[index - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  return longest;
}

export const ACHIEVEMENT_RULES: AchievementRule[] = [
  {
    id: 'first-book',
    title: 'First chapter closed',
    description: 'Finish your first book.',
    target: 1,
    measure: differentBooksFinished,
  },
  {
    id: 'five-books',
    title: 'Bookshelf builder',
    description: 'Finish five different books.',
    target: 5,
    measure: differentBooksFinished,
  },
  {
    id: 'ten-books',
    title: 'Page turner',
    description: 'Finish ten different books.',
    target: 10,
    measure: differentBooksFinished,
  },
  {
    id: 'first-hour',
    title: 'Lost in a book',
    description: 'Read for one hour in total.',
    target: 60,
    measure: minutesRead,
  },
  {
    id: 'ten-hours',
    title: 'Deep reader',
    description: 'Read for ten hours in total.',
    target: 600,
    measure: minutesRead,
  },
  {
    id: 'three-day-streak',
    title: 'Getting into the habit',
    description: 'Read three days in a row.',
    target: 3,
    measure: longestStreak,
  },
  {
    id: 'seven-day-streak',
    title: 'A week of reading',
    description: 'Read seven days in a row.',
    target: 7,
    measure: longestStreak,
  },
];

/** Where the Reader stands on every Achievement. Pure: ask again at any time and the answer follows the history. */
export function evaluateAchievements(
  history: AchievementHistory,
  now: Date,
  timeZone: string,
  rules: AchievementRule[] = ACHIEVEMENT_RULES,
): Achievement[] {
  return rules.map((rule) => {
    const measured = rule.measure(history, now, timeZone);
    return {
      id: rule.id,
      title: rule.title,
      description: rule.description,
      current: Math.min(measured, rule.target),
      target: rule.target,
      earned: measured >= rule.target,
    };
  });
}

export async function loadAchievements(storage: Storage, now: Date, timeZone: string): Promise<Achievement[]> {
  const [finishes, sessions] = await Promise.all([storage.library.finishes(), storage.sessions.all()]);
  return evaluateAchievements({ finishes, sessions }, now, timeZone);
}
