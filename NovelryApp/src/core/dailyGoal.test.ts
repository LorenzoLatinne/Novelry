import { dailyGoalProgress } from './dailyGoal';
import type { ReadingSession } from './storage/storage';

let nextId = 1;
const session = (start: string, end: string | null): ReadingSession => ({
  id: nextId++,
  isbn: '9780261102354',
  startedAt: start,
  endedAt: end,
});

const BRUSSELS = 'Europe/Brussels';

describe('dailyGoalProgress', () => {
  const now = new Date('2026-03-11T14:00:00Z'); // 15:00 on Wed 11 March in Brussels

  it('compares the minutes read today with the target', () => {
    const sessions = [
      session('2026-03-11T08:00:00Z', '2026-03-11T08:20:00Z'), // 20 min today
      session('2026-03-10T08:00:00Z', '2026-03-10T09:00:00Z'), // yesterday, not counted
    ];

    expect(dailyGoalProgress(30, sessions, now, BRUSSELS)).toEqual({
      targetMinutes: 30,
      minutesRead: 20,
      percent: 67,
      reached: false,
    });
  });

  it('counts only the part of a session after midnight toward today', () => {
    // 23:40 to 00:20 Brussels = 22:40Z to 23:20Z; only 20 minutes fall on the 11th
    const sessions = [session('2026-03-10T22:40:00Z', '2026-03-10T23:20:00Z')];

    expect(dailyGoalProgress(30, sessions, new Date('2026-03-10T23:30:00Z'), BRUSSELS).minutesRead).toBe(20);
    expect(dailyGoalProgress(30, sessions, new Date('2026-03-10T23:30:00Z'), 'UTC').minutesRead).toBe(40);
  });

  it('is reached at the target, and the percentage stops at 100 beyond it', () => {
    const sessions = [session('2026-03-11T08:00:00Z', '2026-03-11T09:00:00Z')];

    expect(dailyGoalProgress(60, sessions, now, BRUSSELS)).toMatchObject({ percent: 100, reached: true });
    expect(dailyGoalProgress(20, sessions, now, BRUSSELS)).toMatchObject({
      minutesRead: 60,
      percent: 100,
      reached: true,
    });
  });

  it('counts a running session up to now', () => {
    const sessions = [session('2026-03-11T13:30:00Z', null)];

    expect(dailyGoalProgress(60, sessions, now, BRUSSELS).minutesRead).toBe(30);
  });

  it('shows whole minutes only, so 59 seconds is not yet a minute', () => {
    const sessions = [session('2026-03-11T08:00:00Z', '2026-03-11T08:00:59Z')];

    expect(dailyGoalProgress(10, sessions, now, BRUSSELS)).toMatchObject({ minutesRead: 0, percent: 0 });
  });

  it('starts again at zero the next day', () => {
    const sessions = [session('2026-03-11T08:00:00Z', '2026-03-11T09:00:00Z')];

    expect(dailyGoalProgress(30, sessions, new Date('2026-03-12T08:00:00Z'), BRUSSELS).minutesRead).toBe(0);
  });
});
