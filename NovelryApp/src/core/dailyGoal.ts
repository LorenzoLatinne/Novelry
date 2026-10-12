import { readingTime } from './readingTime';
import type { ReadingSession } from './storage/storage';

export type DailyGoalProgress = {
  targetMinutes: number;
  /** Whole minutes read today. */
  minutesRead: number;
  /** Whole percentage of the target, at most 100. */
  percent: number;
  reached: boolean;
};

/**
 * How much of today's reading goal the Reader has done. Derived from Reading Sessions by the Reader's
 * calendar (a session past midnight counts toward each day it covers); nothing about progress is stored.
 */
export function dailyGoalProgress(
  targetMinutes: number,
  sessions: ReadingSession[],
  now: Date,
  timeZone: string,
): DailyGoalProgress {
  const minutesRead = Math.floor(readingTime(sessions, now, timeZone).today / 60);
  return {
    targetMinutes,
    minutesRead,
    percent: Math.min(100, Math.round((minutesRead / targetMinutes) * 100)),
    reached: minutesRead >= targetMinutes,
  };
}
