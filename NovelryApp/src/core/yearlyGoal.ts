import { localParts } from './localTime';

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
  const finishedThisYear = new Set(
    finishes
      .filter((finish) => localParts(Date.parse(finish.finishedAt), timeZone).year === year)
      .map((finish) => finish.isbn),
  );
  const finished = finishedThisYear.size;
  return {
    year,
    target,
    finished,
    percent: Math.min(100, Math.round((finished / target) * 100)),
    reached: finished >= target,
  };
}
