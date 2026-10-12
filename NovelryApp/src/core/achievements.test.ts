import { ACHIEVEMENT_RULES, evaluateAchievements, loadAchievements, type AchievementHistory } from './achievements';
import { openStorage } from './storage/storage';
import { createTestDatabase } from './storage/testDatabase';

const BRUSSELS = 'Europe/Brussels';
const NOW = new Date('2026-03-20T12:00:00Z');

const finish = (isbn: string, at = '2026-03-01T10:00:00Z') => ({ isbn, finishedAt: at });
let id = 1;
const session = (start: string, end: string | null) => ({ id: id++, isbn: '1', startedAt: start, endedAt: end });

const nobody: AchievementHistory = { finishes: [], sessions: [] };
function status(history: AchievementHistory, achievementId: string, timeZone = BRUSSELS) {
  return evaluateAchievements(history, NOW, timeZone).find((a) => a.id === achievementId)!;
}
const minutes = (from: string, count: number) => {
  const start = new Date(from);
  return session(start.toISOString(), new Date(start.getTime() + count * 60_000).toISOString());
};
const dayRange = (from: number, days: number) =>
  Array.from({ length: days }, (_, i) => minutes(`2026-03-${String(from + i).padStart(2, '0')}T10:00:00Z`, 10));

describe('achievements', () => {
  it('offers a small starting set, none earned by a new Reader', () => {
    const all = evaluateAchievements(nobody, NOW, BRUSSELS);

    expect(all.map((a) => a.id)).toEqual([
      'first-book',
      'five-books',
      'ten-books',
      'first-hour',
      'ten-hours',
      'three-day-streak',
      'seven-day-streak',
    ]);
    expect(all.every((a) => !a.earned && a.current === 0)).toBe(true);
    expect(all.every((a) => a.title && a.description)).toBe(true);
  });

  describe('finishing Books', () => {
    it('first-book: earned by the first Book finished', () => {
      expect(status(nobody, 'first-book').earned).toBe(false);
      expect(status({ ...nobody, finishes: [finish('1')] }, 'first-book')).toMatchObject({ earned: true, current: 1, target: 1 });
    });

    it('five-books and ten-books: count different Books, in any year', () => {
      const four = ['1', '2', '3', '4'].map((isbn) => finish(isbn));
      expect(status({ ...nobody, finishes: four }, 'five-books')).toMatchObject({ earned: false, current: 4, target: 5 });

      const five = [...four, finish('5', '2024-01-01T10:00:00Z')];
      expect(status({ ...nobody, finishes: five }, 'five-books')).toMatchObject({ earned: true, current: 5 });
      expect(status({ ...nobody, finishes: five }, 'ten-books').earned).toBe(false);

      const ten = Array.from({ length: 10 }, (_, i) => finish(String(i)));
      expect(status({ ...nobody, finishes: ten }, 'ten-books')).toMatchObject({ earned: true, current: 10 });
    });

    it('counts a Book finished twice once', () => {
      const twice = [finish('1'), finish('1', '2026-03-05T10:00:00Z')];

      expect(status({ ...nobody, finishes: twice }, 'first-book').current).toBe(1);
      expect(status({ ...nobody, finishes: twice }, 'five-books').current).toBe(1);
    });

    it('never shows more progress than the target', () => {
      const twelve = Array.from({ length: 12 }, (_, i) => finish(String(i)));

      expect(status({ ...nobody, finishes: twelve }, 'five-books')).toMatchObject({ current: 5, target: 5, earned: true });
    });
  });

  describe('time spent reading', () => {
    it('first-hour: earned after an hour of reading in total', () => {
      const almost = [minutes('2026-03-10T10:00:00Z', 30), minutes('2026-03-11T10:00:00Z', 29)];
      expect(status({ ...nobody, sessions: almost }, 'first-hour')).toMatchObject({ earned: false, current: 59, target: 60 });

      const enough = [...almost, minutes('2026-03-12T10:00:00Z', 1)];
      expect(status({ ...nobody, sessions: enough }, 'first-hour')).toMatchObject({ earned: true, current: 60 });
    });

    it('ten-hours: earned after ten hours of reading', () => {
      const sessions = Array.from({ length: 10 }, (_, i) => minutes(`2026-03-${String(i + 1).padStart(2, '0')}T10:00:00Z`, 60));

      expect(status({ ...nobody, sessions }, 'ten-hours')).toMatchObject({ earned: true, current: 600 });
      expect(status({ ...nobody, sessions: sessions.slice(1) }, 'ten-hours')).toMatchObject({ earned: false, current: 540 });
    });

    it('does not count overlapping sessions twice', () => {
      const overlapping = [minutes('2026-03-10T10:00:00Z', 40), minutes('2026-03-10T10:20:00Z', 40)]; // 60 min of clock time

      expect(status({ ...nobody, sessions: overlapping }, 'first-hour')).toMatchObject({ earned: true, current: 60 });
    });

    it('counts a session that is still running up to now', () => {
      const running = [session('2026-03-20T10:30:00Z', null)]; // 90 minutes before NOW

      expect(status({ ...nobody, sessions: running }, 'first-hour').earned).toBe(true);
    });
  });

  describe('reading on consecutive days', () => {
    it('three-day-streak: earned by reading on three days in a row', () => {
      expect(status({ ...nobody, sessions: dayRange(10, 2) }, 'three-day-streak')).toMatchObject({ earned: false, current: 2, target: 3 });
      expect(status({ ...nobody, sessions: dayRange(10, 3) }, 'three-day-streak')).toMatchObject({ earned: true, current: 3 });
    });

    it('seven-day-streak: earned by a week in a row', () => {
      expect(status({ ...nobody, sessions: dayRange(1, 6) }, 'seven-day-streak').earned).toBe(false);
      expect(status({ ...nobody, sessions: dayRange(1, 7) }, 'seven-day-streak')).toMatchObject({ earned: true, current: 7 });
    });

    it('a missed day breaks the streak, but the longest streak is remembered', () => {
      const sessions = [...dayRange(1, 3), ...dayRange(5, 2)]; // 1-3, gap on the 4th, 5-6

      expect(status({ ...nobody, sessions }, 'three-day-streak')).toMatchObject({ earned: true, current: 3 });
      expect(status({ ...nobody, sessions }, 'seven-day-streak').current).toBe(3);
    });

    it('counts days by the Reader’s calendar', () => {
      // Reading at 23:30 Brussels on the 10th (22:30Z) and 00:30 on the 11th (23:30Z): two calendar days in Brussels, one in UTC
      const sessions = [minutes('2026-03-10T22:30:00Z', 10), minutes('2026-03-10T23:30:00Z', 10)];

      expect(status({ ...nobody, sessions }, 'three-day-streak', BRUSSELS).current).toBe(2);
      expect(status({ ...nobody, sessions }, 'three-day-streak', 'UTC').current).toBe(1);
    });

    it('counts every day a session that crosses midnight touches', () => {
      const overnight = [session('2026-03-10T22:30:00Z', '2026-03-11T23:30:00Z')]; // Brussels 23:30 on the 10th to 00:30 on the 12th

      expect(status({ ...nobody, sessions: overnight }, 'three-day-streak')).toMatchObject({ current: 3, earned: true });
    });

    it('ignores sessions with no length, or that end before they start', () => {
      const sessions = [
        minutes('2026-03-10T10:00:00Z', 0),
        session('2026-03-11T10:00:00Z', '2026-03-11T09:00:00Z'),
      ];

      expect(status({ ...nobody, sessions }, 'three-day-streak').current).toBe(0);
    });

    it('does not count the next day for a session that ends exactly at midnight', () => {
      // Brussels midnight on the 12th is 23:00Z on the 11th
      const sessions = [session('2026-03-11T22:00:00Z', '2026-03-11T23:00:00Z')];

      expect(status({ ...nobody, sessions }, 'three-day-streak').current).toBe(1);
    });

    it('counts the days of a session that began before the clocks went forward', () => {
      // Brussels, spring 2025: 29 Mar 23:30 to 31 Mar 00:30 spans the 29th, the 30th (a 23-hour day) and the 31st
      const sessions = [session('2025-03-29T22:30:00Z', '2025-03-30T22:30:00Z')];

      expect(status({ ...nobody, sessions }, 'three-day-streak')).toMatchObject({ current: 3, earned: true });
    });

    it('counts every day of a session that is still running from days ago', () => {
      const running = [session('2026-03-17T10:00:00Z', null)]; // 17th to NOW on the 20th

      expect(status({ ...nobody, sessions: running }, 'three-day-streak')).toMatchObject({ current: 3, earned: true });
      expect(status({ ...nobody, sessions: running }, 'seven-day-streak').current).toBe(4);
    });

    it('cannot be sent into a long loop by a corrupt or far-future end time', () => {
      const corrupt = [
        session('2026-03-10T10:00:00Z', '9999-12-31T10:00:00Z'),
        session('2026-03-10T10:00:00Z', 'not a date'),
        session('also not a date', '2026-03-10T10:00:00Z'),
      ];
      const before = Date.now();

      const result = status({ ...nobody, sessions: corrupt }, 'seven-day-streak');

      expect(Date.now() - before).toBeLessThan(2000);
      expect(result.current).toBeLessThanOrEqual(11); // from the 10th to NOW on the 20th at most
    });

    it('streaks run across month ends', () => {
      const sessions = [
        minutes('2026-02-27T10:00:00Z', 10),
        minutes('2026-02-28T10:00:00Z', 10),
        minutes('2026-03-01T10:00:00Z', 10),
      ];

      expect(status({ ...nobody, sessions }, 'three-day-streak').earned).toBe(true);
    });
  });

  describe('recalculating', () => {
    const history: AchievementHistory = {
      finishes: [finish('1'), finish('2')],
      sessions: dayRange(1, 4),
    };

    it('gives the same answer every time', () => {
      expect(evaluateAchievements(history, NOW, BRUSSELS)).toEqual(evaluateAchievements(history, NOW, BRUSSELS));
    });

    it('does not depend on the order of the history', () => {
      const shuffled = { finishes: [...history.finishes].reverse(), sessions: [...history.sessions].reverse() };

      expect(evaluateAchievements(shuffled, NOW, BRUSSELS)).toEqual(evaluateAchievements(history, NOW, BRUSSELS));
    });

    it('can take a new rule without any change to the stored data', () => {
      const extra = {
        id: 'two-books',
        title: 'Two of a kind',
        description: 'Finish two books.',
        target: 2,
        measure: (h: AchievementHistory) => new Set(h.finishes.map((f) => f.isbn)).size,
      };

      const all = evaluateAchievements(history, NOW, BRUSSELS, [...ACHIEVEMENT_RULES, extra]);

      expect(all).toHaveLength(ACHIEVEMENT_RULES.length + 1);
      expect(all.find((a) => a.id === 'two-books')).toMatchObject({ earned: true, current: 2, target: 2 });
    });

    it('has unique ids', () => {
      const ids = ACHIEVEMENT_RULES.map((rule) => rule.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('from the Reader’s data on the device', () => {
    const T0 = new Date('2026-03-02T11:00:00Z');
    const T1 = new Date('2026-03-09T11:00:00Z');

    async function readerWithOneFinishedBook() {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add({ isbn: '1', title: 'One', authors: [], genres: [] });
      await storage.library.moveToShelf('1', 'read', new Date('2026-03-02T10:00:00Z'));
      await storage.sessions.addManual('1', new Date('2026-03-02T09:00:00Z'), new Date('2026-03-02T10:30:00Z'), NOW);
      return storage;
    }

    it('is worked out from finished Books and Reading Sessions', async () => {
      const storage = await readerWithOneFinishedBook();

      const all = await loadAchievements(storage, T0, BRUSSELS);

      expect(all.filter((a) => a.earned).map((a) => a.id)).toEqual(['first-book', 'first-hour']);
    });

    it('remembers when each Achievement was first earned', async () => {
      const storage = await readerWithOneFinishedBook();

      const all = await loadAchievements(storage, T0, BRUSSELS);

      expect(all.find((a) => a.id === 'first-book')?.earnedAt).toBe('2026-03-02T11:00:00.000Z');
      expect(all.find((a) => a.id === 'five-books')?.earnedAt).toBeNull();
    });

    it('keeps an earned Achievement when the history later changes (a mistake is corrected)', async () => {
      const storage = await readerWithOneFinishedBook();
      await loadAchievements(storage, T0, BRUSSELS);

      await storage.library.moveToShelf('1', 'want-to-read', T1); // undoes the finish
      const [session] = await storage.sessions.all();
      await storage.sessions.remove(session.id);
      const all = await loadAchievements(storage, T1, BRUSSELS);

      expect(all.filter((a) => a.earned).map((a) => a.id)).toEqual(['first-book', 'first-hour']);
      expect(all.find((a) => a.id === 'first-book')).toMatchObject({ earnedAt: '2026-03-02T11:00:00.000Z', current: 0 });
    });

    it('gives the same answer, and the same earned dates, each time it is recalculated', async () => {
      const storage = await readerWithOneFinishedBook();

      const first = await loadAchievements(storage, T0, BRUSSELS);
      const again = await loadAchievements(storage, T1, BRUSSELS);

      expect(again).toEqual(first);
    });

    it('records an Achievement the first time it is seen to be earned, and not twice', async () => {
      const storage = await readerWithOneFinishedBook();

      await loadAchievements(storage, T0, BRUSSELS);
      await loadAchievements(storage, T1, BRUSSELS);

      expect((await storage.achievements.all()).map((a) => a.id).sort()).toEqual(['first-book', 'first-hour']);
    });

    it('records Achievements as they are earned over time', async () => {
      const storage = await readerWithOneFinishedBook();
      await loadAchievements(storage, T0, BRUSSELS);
      await storage.library.add({ isbn: '2', title: 'Two', authors: [], genres: [] });
      await storage.sessions.addManual('2', new Date('2026-03-03T09:00:00Z'), new Date('2026-03-03T09:10:00Z'), NOW);
      await storage.sessions.addManual('2', new Date('2026-03-04T09:00:00Z'), new Date('2026-03-04T09:10:00Z'), NOW);

      const all = await loadAchievements(storage, T1, BRUSSELS);

      expect(all.find((a) => a.id === 'three-day-streak')).toMatchObject({ earned: true, earnedAt: '2026-03-09T11:00:00.000Z' });
      expect(all.find((a) => a.id === 'first-book')?.earnedAt).toBe('2026-03-02T11:00:00.000Z');
    });
  
    it('shows an Achievement as new until the Reader has been told about it, once', async () => {
      const storage = await readerWithOneFinishedBook();

      const first = await loadAchievements(storage, T0, BRUSSELS);
      expect(first.filter((a) => a.isNew).map((a) => a.id)).toEqual(['first-book', 'first-hour']);

      await storage.achievements.markSeen(first.filter((a) => a.isNew).map((a) => a.id));
      const second = await loadAchievements(storage, T1, BRUSSELS);

      expect(second.filter((a) => a.isNew)).toEqual([]);
      expect(second.filter((a) => a.earned)).toHaveLength(2);
    });

    it('only the Achievement earned since is new the next time', async () => {
      const storage = await readerWithOneFinishedBook();
      const first = await loadAchievements(storage, T0, BRUSSELS);
      await storage.achievements.markSeen(first.filter((a) => a.isNew).map((a) => a.id));
      await storage.library.add({ isbn: '2', title: 'Two', authors: [], genres: [] });
      await storage.sessions.addManual('2', new Date('2026-03-03T09:00:00Z'), new Date('2026-03-03T09:10:00Z'), NOW);
      await storage.sessions.addManual('2', new Date('2026-03-04T09:00:00Z'), new Date('2026-03-04T09:10:00Z'), NOW);

      const next = await loadAchievements(storage, T1, BRUSSELS);

      expect(next.filter((a) => a.isNew).map((a) => a.id)).toEqual(['three-day-streak']);
    });
  });
});
