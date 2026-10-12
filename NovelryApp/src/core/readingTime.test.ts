import { readingTime } from './readingTime';
import type { ReadingSession } from './storage/storage';

let nextId = 1;
function session(start: string, end: string | null): ReadingSession {
  return { id: nextId++, isbn: '9780261102354', startedAt: start, endedAt: end };
}

const MIN = 60;
const BRUSSELS = 'Europe/Brussels'; // UTC+1 in winter, UTC+2 in summer

describe('readingTime', () => {
  it('adds up what was read today, this week and this year', () => {
    // Wed 11 Mar 2026, 15:00 in Brussels (14:00 UTC)
    const now = new Date('2026-03-11T14:00:00Z');
    const sessions = [
      session('2026-03-11T08:00:00Z', '2026-03-11T08:30:00Z'), // today: 30 min
      session('2026-03-09T19:00:00Z', '2026-03-09T20:00:00Z'), // Monday: 60 min, this week
      session('2026-03-08T10:00:00Z', '2026-03-08T11:00:00Z'), // Sunday: last week, 60 min
      session('2026-01-05T10:00:00Z', '2026-01-05T10:20:00Z'), // January: 20 min
    ];

    expect(readingTime(sessions, now, BRUSSELS)).toEqual({
      today: 30 * MIN,
      thisWeek: 90 * MIN,
      thisYear: 170 * MIN,
    });
  });

  it('splits a session that runs past midnight between the two days', () => {
    // 23:30 to 00:30 Brussels on the night of 10 to 11 March = 22:30 to 23:30 UTC
    const sessions = [session('2026-03-10T22:30:00Z', '2026-03-10T23:30:00Z')];

    // Looking on the 11th (after midnight): only the half hour after midnight is "today"
    expect(readingTime(sessions, new Date('2026-03-11T10:00:00Z'), BRUSSELS).today).toBe(30 * MIN);
    // Looking on the 10th: the half hour before midnight is "today"
    expect(readingTime(sessions, new Date('2026-03-10T23:45:00Z'), BRUSSELS).today).toBe(30 * MIN);
  });

  it('starts the week on Monday', () => {
    const sessions = [session('2026-03-08T10:00:00Z', '2026-03-08T11:00:00Z')]; // Sunday 8 March

    expect(readingTime(sessions, new Date('2026-03-08T18:00:00Z'), BRUSSELS).thisWeek).toBe(60 * MIN);
    expect(readingTime(sessions, new Date('2026-03-09T09:00:00Z'), BRUSSELS).thisWeek).toBe(0);
  });

  it('splits a session across New Year between the two years', () => {
    // 23:30 to 00:30 Brussels over New Year = 22:30 to 23:30 UTC on 31 Dec
    const sessions = [session('2025-12-31T22:30:00Z', '2025-12-31T23:30:00Z')];

    expect(readingTime(sessions, new Date('2026-06-01T12:00:00Z'), BRUSSELS).thisYear).toBe(30 * MIN);
    expect(readingTime(sessions, new Date('2025-12-31T23:45:00Z'), BRUSSELS).thisYear).toBe(30 * MIN);
  });

  it('decides which day it is by the Reader’s time zone', () => {
    // 23:30 UTC on 10 March is already 00:30 on the 11th in Brussels
    const sessions = [session('2026-03-10T23:00:00Z', '2026-03-10T23:30:00Z')];
    const now = new Date('2026-03-11T00:10:00Z');

    expect(readingTime(sessions, now, 'UTC').today).toBe(0); // in UTC it is still the 10th when she read
    expect(readingTime(sessions, now, BRUSSELS).today).toBe(30 * MIN);
  });

  it('counts a running session up to now', () => {
    const now = new Date('2026-03-11T14:00:00Z');
    const sessions = [session('2026-03-11T13:00:00Z', null)];

    expect(readingTime(sessions, now, BRUSSELS).today).toBe(60 * MIN);
  });

  it('copes with the clock change in spring', () => {
    // Brussels moves from 02:00 to 03:00 on Sun 29 March 2026. 00:30-04:30 local = 23:30Z-02:30Z: 3 h of real time.
    const sessions = [session('2026-03-28T23:30:00Z', '2026-03-29T02:30:00Z')];

    expect(readingTime(sessions, new Date('2026-03-29T12:00:00Z'), BRUSSELS).today).toBe(3 * 60 * MIN);
  });

  it('is zero when nothing was read', () => {
    expect(readingTime([], new Date('2026-03-11T14:00:00Z'), BRUSSELS)).toEqual({
      today: 0,
      thisWeek: 0,
      thisYear: 0,
    });
  });
});
