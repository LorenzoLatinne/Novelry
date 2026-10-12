import { dashboardView, loadDashboard } from './dashboard';
import { openStorage } from './storage/storage';
import { createTestDatabase } from './storage/testDatabase';

const BRUSSELS = 'Europe/Brussels';
const book = (isbn: string, title: string) => ({ isbn, title, authors: [], genres: [] });

async function storageWithReading() {
  const storage = await openStorage(createTestDatabase());
  await storage.library.add(book('1', 'The Hobbit'));
  await storage.library.add(book('2', 'Dune'));
  return storage;
}

describe('dashboard', () => {
  const now = new Date('2026-03-11T14:00:00Z'); // 15:00 on 11 March in Brussels

  it('shows no goals and no reading when the Reader has just started', async () => {
    const storage = await openStorage(createTestDatabase());

    const view = dashboardView(await loadDashboard(storage), now, BRUSSELS);

    expect(view).toEqual({
      year: 2026,
      readingTime: { today: 0, thisWeek: 0, thisYear: 0 },
      booksThisYear: 0,
      yearlyGoal: null,
      dailyGoal: null,
      currentSession: null,
    });
  });

  it('brings the Reader’s reading, finished Books and goals together', async () => {
    const storage = await storageWithReading();
    await storage.library.moveToShelf('1', 'read', new Date('2026-02-01T10:00:00Z'));
    await storage.sessions.addManual('2', new Date('2026-03-11T08:00:00Z'), new Date('2026-03-11T08:20:00Z'), now);
    await storage.goals.setYearlyBooks(4);
    await storage.goals.setDailyMinutes(30);

    const view = dashboardView(await loadDashboard(storage), now, BRUSSELS);

    expect(view.booksThisYear).toBe(1);
    expect(view.readingTime).toEqual({ today: 20 * 60, thisWeek: 20 * 60, thisYear: 20 * 60 });
    expect(view.yearlyGoal).toMatchObject({ finished: 1, target: 4, percent: 25 });
    expect(view.dailyGoal).toMatchObject({ minutesRead: 20, targetMinutes: 30, percent: 67 });
  });

  it('names the Book being read now and how long the session has run', async () => {
    const storage = await storageWithReading();
    await storage.sessions.start('2', new Date('2026-03-11T13:30:00Z'));

    const view = dashboardView(await loadDashboard(storage), now, BRUSSELS);

    expect(view.currentSession).toEqual({ isbn: '2', title: 'Dune', elapsedSeconds: 30 * 60 });
  });

  it('keeps counting the running session as time passes, without loading again', async () => {
    const storage = await storageWithReading();
    await storage.goals.setDailyMinutes(30);
    await storage.sessions.start('2', new Date('2026-03-11T13:30:00Z'));
    const data = await loadDashboard(storage);

    const later = dashboardView(data, new Date('2026-03-11T14:10:00Z'), BRUSSELS);

    expect(later.currentSession?.elapsedSeconds).toBe(40 * 60);
    expect(later.dailyGoal).toMatchObject({ minutesRead: 40, reached: true });
  });

  it('rolls over at midnight: yesterday’s reading no longer counts as today', async () => {
    const storage = await storageWithReading();
    await storage.sessions.addManual('1', new Date('2026-03-11T08:00:00Z'), new Date('2026-03-11T09:00:00Z'), now);
    const data = await loadDashboard(storage);

    expect(dashboardView(data, now, BRUSSELS).readingTime.today).toBe(60 * 60);
    expect(dashboardView(data, new Date('2026-03-11T23:30:00Z'), BRUSSELS).readingTime.today).toBe(0);
  });

  it('starts the new year’s count at zero on New Year', async () => {
    const storage = await storageWithReading();
    await storage.library.moveToShelf('1', 'read', new Date('2026-12-31T10:00:00Z'));
    const data = await loadDashboard(storage);

    expect(dashboardView(data, new Date('2026-12-31T22:00:00Z'), BRUSSELS).booksThisYear).toBe(1);
    expect(dashboardView(data, new Date('2026-12-31T23:30:00Z'), BRUSSELS)).toMatchObject({
      year: 2027,
      booksThisYear: 0,
    });
  });

  it('falls back to the ISBN when the running Book’s details are missing', async () => {
    const storage = await storageWithReading();
    await storage.sessions.start('1', new Date('2026-03-11T13:50:00Z'));
    const data = await loadDashboard(storage);

    const view = dashboardView({ ...data, runningBook: null }, now, BRUSSELS);

    expect(view.currentSession).toEqual({ isbn: '1', title: '1', elapsedSeconds: 10 * 60 });
  });
});
