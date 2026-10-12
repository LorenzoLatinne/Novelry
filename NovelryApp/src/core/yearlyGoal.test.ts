import { booksFinishedInYear, yearlyGoalProgress } from './yearlyGoal';

const BRUSSELS = 'Europe/Brussels';
const finish = (isbn: string, at: string) => ({ isbn, finishedAt: at });

describe('yearlyGoalProgress', () => {
  const now = new Date('2026-06-15T12:00:00Z');

  it('counts the Books finished this year against the target', () => {
    const finishes = [
      finish('1', '2026-01-10T10:00:00Z'),
      finish('2', '2026-05-02T10:00:00Z'),
      finish('3', '2025-12-30T10:00:00Z'), // last year
    ];

    expect(yearlyGoalProgress(12, finishes, now, BRUSSELS)).toEqual({
      year: 2026,
      target: 12,
      finished: 2,
      percent: 17,
      reached: false,
    });
  });

  it('decides the year by the Reader’s calendar, at New Year', () => {
    // 23:30 UTC on 31 Dec is already 00:30 on 1 Jan in Brussels
    const finishes = [finish('1', '2025-12-31T23:30:00Z')];

    expect(yearlyGoalProgress(10, finishes, now, BRUSSELS).finished).toBe(1);
    expect(yearlyGoalProgress(10, finishes, now, 'UTC').finished).toBe(0);
  });

  it('puts a Book finished just before midnight on New Year’s Eve in the old year', () => {
    const finishes = [finish('1', '2026-12-31T22:30:00Z')]; // 23:30 in Brussels

    expect(yearlyGoalProgress(10, finishes, new Date('2026-12-31T22:45:00Z'), BRUSSELS).finished).toBe(1);
    expect(yearlyGoalProgress(10, finishes, new Date('2027-01-02T10:00:00Z'), BRUSSELS).finished).toBe(0);
  });

  it('counts a Book once, even if it has been finished more than once', () => {
    const finishes = [finish('1', '2026-02-01T10:00:00Z'), finish('1', '2026-04-01T10:00:00Z')];

    expect(yearlyGoalProgress(5, finishes, now, BRUSSELS).finished).toBe(1);
  });

  it('is reached at the target, and the percentage stops at 100 beyond it', () => {
    const finishes = ['1', '2', '3'].map((isbn) => finish(isbn, '2026-03-01T10:00:00Z'));

    expect(yearlyGoalProgress(3, finishes, now, BRUSSELS)).toMatchObject({ percent: 100, reached: true });
    expect(yearlyGoalProgress(2, finishes, now, BRUSSELS)).toMatchObject({ finished: 3, percent: 100, reached: true });
  });

  it('shows no progress when nothing was finished', () => {
    expect(yearlyGoalProgress(12, [], now, BRUSSELS)).toMatchObject({ finished: 0, percent: 0, reached: false });
  });

  it('keeps the earlier years’ finishes out of the count when the target changes', () => {
    const finishes = [finish('1', '2025-06-01T10:00:00Z'), finish('2', '2026-06-01T10:00:00Z')];

    expect(yearlyGoalProgress(20, finishes, now, BRUSSELS).finished).toBe(1);
    expect(yearlyGoalProgress(5, finishes, now, BRUSSELS).finished).toBe(1);
  });

  it('does not show 100% until the goal is actually reached', () => {
    const finishes = Array.from({ length: 199 }, (_, i) => finish(String(i), '2026-03-01T10:00:00Z'));

    expect(yearlyGoalProgress(200, finishes, now, BRUSSELS)).toMatchObject({ percent: 99, reached: false });
  });
});

describe('booksFinishedInYear', () => {
  const now = new Date('2026-06-15T12:00:00Z');

  it('counts the different Books finished in the current year, by the Reader’s calendar', () => {
    const finishes = [
      finish('1', '2026-01-10T10:00:00Z'),
      finish('1', '2026-03-10T10:00:00Z'), // the same Book again
      finish('2', '2026-05-02T10:00:00Z'),
      finish('3', '2025-12-31T10:00:00Z'), // last year
      finish('4', '2025-12-31T23:30:00Z'), // 00:30 on 1 Jan in Brussels: this year there
    ];

    expect(booksFinishedInYear(finishes, now, BRUSSELS)).toBe(3);
    expect(booksFinishedInYear(finishes, now, 'UTC')).toBe(2);
  });

  it('is zero when nothing was finished', () => {
    expect(booksFinishedInYear([], now, BRUSSELS)).toBe(0);
  });
});
