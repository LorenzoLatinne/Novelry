import { dailyGoalProgress, type DailyGoalProgress } from './dailyGoal';
import type { Book } from './catalog/book';
import { localParts } from './localTime';
import { readingTime, type ReadingTime } from './readingTime';
import type { ReadingSession, Storage } from './storage/storage';
import { booksFinishedInYear, yearlyGoalProgress, type Finish, type YearlyGoalProgress } from './yearlyGoal';

/** Everything the Dashboard needs from the device, before it is related to a moment in time. */
export type DashboardData = {
  sessions: ReadingSession[];
  finishes: Finish[];
  yearlyTarget: number | null;
  dailyTarget: number | null;
  runningSession: ReadingSession | null;
  runningBook: Book | null;
};

export type DashboardView = {
  year: number;
  readingTime: ReadingTime;
  booksThisYear: number;
  yearlyGoal: YearlyGoalProgress | null;
  dailyGoal: DailyGoalProgress | null;
  currentSession: { isbn: string; title: string; elapsedSeconds: number } | null;
};

export async function loadDashboard(storage: Storage): Promise<DashboardData> {
  const [sessions, finishes, yearlyTarget, dailyTarget, runningSession] = await Promise.all([
    storage.sessions.all(),
    storage.library.finishes(),
    storage.goals.getYearlyBooks(),
    storage.goals.getDailyMinutes(),
    storage.sessions.running(),
  ]);
  const runningBook = runningSession ? await storage.books.get(runningSession.isbn) : null;
  return { sessions, finishes, yearlyTarget, dailyTarget, runningSession, runningBook };
}

/**
 * What the Dashboard shows at a given moment. Pure, so it can be run again every second while a
 * session is running, and again at midnight, without loading from the device.
 */
export function dashboardView(data: DashboardData, now: Date, timeZone: string): DashboardView {
  const { runningSession, runningBook } = data;
  return {
    year: localParts(now.getTime(), timeZone).year,
    readingTime: readingTime(data.sessions, now, timeZone),
    booksThisYear: booksFinishedInYear(data.finishes, now, timeZone),
    yearlyGoal:
      data.yearlyTarget === null ? null : yearlyGoalProgress(data.yearlyTarget, data.finishes, now, timeZone),
    dailyGoal:
      data.dailyTarget === null ? null : dailyGoalProgress(data.dailyTarget, data.sessions, now, timeZone),
    currentSession: runningSession && {
      isbn: runningSession.isbn,
      title: runningBook?.title ?? runningSession.isbn,
      elapsedSeconds: Math.max(0, Math.floor((now.getTime() - Date.parse(runningSession.startedAt)) / 1000)),
    },
  };
}
