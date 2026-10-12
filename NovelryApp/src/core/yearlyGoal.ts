import { localParts } from './localTime';
import { percentOf } from './percent';

export type Finish = { isbn: string; finishedAt: string };

export type YearlyGoalProgress = {
  year: number;
  target: number;
  /** Different Books finished this year. */
  finished: number;
  /** Whole percentage of the target, at most 100. */
  percent: number;
  reached: boolean;
};

/** How many different Books the Reader finished this year, by their calendar. */
export function booksFinishedInYear(finishes: Finish[], now: Date, timeZone: string): number {
  const { year } = localParts(now.getTime(), timeZone);
  return new Set(
    finishes
      .filter((finish) => localParts(Date.parse(finish.finishedAt), timeZone).year === year)
      .map((finish) => finish.isbn),
  ).size;
}

/**
 * How far along the Reader is with their yearly Books goal. Derived from when Books were finished,
 * by the Reader's calendar; nothing about progress is stored.
 */
export function yearlyGoalProgress(
  target: number,
  finishes: Finish[],
  now: Date,
  timeZone: string,
): YearlyGoalProgress {
  const { year } = localParts(now.getTime(), timeZone);
  const finished = booksFinishedInYear(finishes, now, timeZone);
  return {
    year,
    target,
    finished,
    percent: percentOf(finished, target),
    reached: finished >= target,
  };
}
