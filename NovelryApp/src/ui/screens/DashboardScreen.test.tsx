import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { createOpenLibraryCatalog } from '../../core/catalog/openLibraryCatalog';
import { openStorage } from '../../core/storage/storage';
import { createTestDatabase } from '../../core/storage/testDatabase';
import { RootNavigator } from '../RootNavigator';

jest.mock('../timeZone', () => ({ deviceTimeZone: () => 'Europe/Brussels' }));

describe('DashboardScreen', () => {
  beforeEach(() => jest.useFakeTimers({ now: new Date('2026-03-11T12:00:00Z'), doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }));
  afterEach(() => jest.useRealTimers());

  async function openDashboard({
    minutesRead,
    finishedBooks = 0,
    yearlyGoal,
    dailyGoal,
  }: { minutesRead?: number; finishedBooks?: number; yearlyGoal?: number; dailyGoal?: number } = {}) {
    const storage = await openStorage(createTestDatabase());
    for (let i = 0; i < finishedBooks; i++) {
      const isbn = `97800000000${i}0`;
      await storage.library.add({ isbn, title: `Book ${i}`, authors: [], genres: [] });
      await storage.library.moveToShelf(isbn, 'read');
    }
    if (yearlyGoal) {
      await storage.goals.setYearlyBooks(yearlyGoal);
    }
    if (dailyGoal) {
      await storage.goals.setDailyMinutes(dailyGoal);
    }
    if (minutesRead) {
      await storage.library.add({ isbn: '9780261102354', title: 'The Hobbit', authors: [], genres: [] });
      await storage.sessions.addManual(
        '9780261102354',
        new Date(Date.now() - minutesRead * 60_000),
        new Date(),
      );
    }
    const catalog = createOpenLibraryCatalog({ fetch: jest.fn() });
    await render(<RootNavigator services={{ storage, catalog }} />);
    await fireEvent.press(screen.getAllByText('Dashboard')[0]);
    return storage;
  }

  it('shows how long the Reader read today, this week and this year', async () => {
    await openDashboard({ minutesRead: 25 });

    expect(await screen.findAllByText('25 min')).toHaveLength(3);
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('This week')).toBeTruthy();
    expect(screen.getByText('This year')).toBeTruthy();
  });

  it('shows zero when nothing has been read', async () => {
    await openDashboard();

    expect(await screen.findAllByText('0 min')).toHaveLength(3);
  });

  it('shows hours and minutes from an hour on', async () => {
    await openDashboard({ minutesRead: 185 });

    expect(await screen.findAllByText('3 h 05 min')).toHaveLength(3);
  });

  describe('yearly goal', () => {
    afterEach(() => jest.restoreAllMocks());

    it('invites the Reader to set a goal, and shows progress once set', async () => {
      const storage = await openDashboard({ finishedBooks: 2 });
      expect(await screen.findByText('Set a reading goal for 2026')).toBeTruthy();

      await fireEvent.changeText(screen.getByLabelText('Books to read this year'), '8');
      await fireEvent.press(screen.getByText('Set goal'));

      expect(await screen.findByText('Reading goal 2026')).toBeTruthy();
      expect(screen.getByText('2 of 8 books')).toBeTruthy();
      expect(screen.getByText('25% of the way there')).toBeTruthy();
      expect(await storage.goals.getYearlyBooks()).toBe(8);
    });

    it('shows a reached goal', async () => {
      await openDashboard({ finishedBooks: 3, yearlyGoal: 3 });

      expect(await screen.findByText('3 of 3 books')).toBeTruthy();
      expect(screen.getByText('Goal reached. Well done!')).toBeTruthy();
    });

    it('changes the target', async () => {
      const storage = await openDashboard({ finishedBooks: 1, yearlyGoal: 5 });
      await screen.findByText('1 of 5 books');

      await fireEvent.press(screen.getByText('Change goal'));
      await fireEvent.changeText(screen.getByLabelText('Books to read this year'), '10');
      await fireEvent.press(screen.getByText('Save'));

      expect(await screen.findByText('1 of 10 books')).toBeTruthy();
      expect(await storage.goals.getYearlyBooks()).toBe(10);
    });

    it('lets the Reader back out of changing the goal', async () => {
      const storage = await openDashboard({ finishedBooks: 1, yearlyGoal: 5 });
      await screen.findByText('1 of 5 books');

      await fireEvent.press(screen.getByText('Change goal'));
      await fireEvent.changeText(screen.getByLabelText('Books to read this year'), '99');
      await fireEvent.press(screen.getByText('Cancel'));

      expect(screen.getByText('Change goal')).toBeTruthy();
      expect(screen.queryByLabelText('Books to read this year')).toBeNull();
      expect(await storage.goals.getYearlyBooks()).toBe(5);
    });

    it('asks for a sensible target', async () => {
      const storage = await openDashboard();
      await screen.findByText('Set a reading goal for 2026');

      for (const text of ['', 'abc', '0', '1001']) {
        await fireEvent.changeText(screen.getByLabelText('Books to read this year'), text);
        await fireEvent.press(screen.getByText('Set goal'));
        expect(await screen.findByText(/whole number of books/)).toBeTruthy();
      }
      expect(await storage.goals.getYearlyBooks()).toBeNull();
    });

    it('removes the goal only after the Reader confirms', async () => {
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const storage = await openDashboard({ finishedBooks: 1, yearlyGoal: 5 });
      await screen.findByText('1 of 5 books');

      await fireEvent.press(screen.getByText('Remove goal'));
      expect(await storage.goals.getYearlyBooks()).toBe(5);

      const confirm = alert.mock.calls[0][2]!.find((b) => b.text === 'Remove')!;
      await act(async () => confirm.onPress!());

      expect(await screen.findByText('Set a reading goal for 2026')).toBeTruthy();
      expect(await storage.goals.getYearlyBooks()).toBeNull();
    });
  });

  describe('daily goal', () => {
    afterEach(() => jest.restoreAllMocks());

    it('invites the Reader to set a daily goal, and shows today’s progress once set', async () => {
      const storage = await openDashboard({ minutesRead: 20 });
      expect(await screen.findByText('Set a daily reading goal')).toBeTruthy();

      await fireEvent.changeText(screen.getByLabelText('Minutes to read each day'), '30');
      await fireEvent.press(screen.getByText('Set daily goal'));

      expect(await screen.findByText('Daily reading goal')).toBeTruthy();
      expect(screen.getByText('20 of 30 minutes today')).toBeTruthy();
      expect(screen.getByText('67% of the way there')).toBeTruthy();
      expect(await storage.goals.getDailyMinutes()).toBe(30);
    });

    it('shows a reached daily goal', async () => {
      await openDashboard({ minutesRead: 45, dailyGoal: 30 });

      expect(await screen.findByText('45 of 30 minutes today')).toBeTruthy();
      expect(screen.getByText('Goal reached. Well done!')).toBeTruthy();
    });

    it('changes and removes the daily goal without touching the yearly goal', async () => {
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const storage = await openDashboard({ yearlyGoal: 5, dailyGoal: 30 });
      await screen.findByText('0 of 30 minutes today');

      await fireEvent.press(screen.getByText('Change daily goal'));
      await fireEvent.changeText(screen.getByLabelText('Minutes to read each day'), '45');
      await fireEvent.press(screen.getByText('Save'));
      expect(await screen.findByText('0 of 45 minutes today')).toBeTruthy();

      await fireEvent.press(screen.getByText('Remove daily goal'));
      const confirm = alert.mock.calls[0][2]!.find((b) => b.text === 'Remove')!;
      await act(async () => confirm.onPress!());

      expect(await screen.findByText('Set a daily reading goal')).toBeTruthy();
      expect(await storage.goals.getDailyMinutes()).toBeNull();
      expect(await storage.goals.getYearlyBooks()).toBe(5);
    });

    it('asks for a sensible number of minutes', async () => {
      const storage = await openDashboard();
      await screen.findByText('Set a daily reading goal');

      for (const text of ['', 'abc', '0', '1441']) {
        await fireEvent.changeText(screen.getByLabelText('Minutes to read each day'), text);
        await fireEvent.press(screen.getByText('Set daily goal'));
        expect(await screen.findByText(/whole number of minutes/)).toBeTruthy();
      }
      expect(await storage.goals.getDailyMinutes()).toBeNull();
    });
  });

  describe('stats and the current session', () => {
    const advance = (ms: number) =>
      act(async () => {
        jest.advanceTimersByTime(ms);
      });

    it('shows how many Books were read this year', async () => {
      await openDashboard({ finishedBooks: 3 });

      expect(await screen.findByText('Read in 2026')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('invites the Reader to set goals when there are none', async () => {
      await openDashboard();

      expect(await screen.findByText('Set a reading goal for 2026')).toBeTruthy();
      expect(screen.getByText('Set a daily reading goal')).toBeTruthy();
      expect(screen.queryByText('Reading now')).toBeNull();
    });

    it('shows the Book being read, with its time ticking, and its goal progress moving with it', async () => {
      const storage = await openDashboard({ dailyGoal: 30 });
      await storage.library.add({ isbn: '9780441172719', title: 'Dune', authors: [], genres: [] });
      await storage.sessions.start('9780441172719', new Date(Date.now() - 10 * 60 * 1000));
      await fireEvent.press(screen.getAllByText('Library')[0]);
      await fireEvent.press(screen.getAllByText('Dashboard')[0]);

      expect(await screen.findByText('Reading now')).toBeTruthy();
      expect(screen.getByText('Dune')).toBeTruthy();
      expect(screen.getByText('10:00')).toBeTruthy();
      expect(screen.getByText('10 of 30 minutes today')).toBeTruthy();

      await advance(5_000);
      expect(screen.getByText('10:05')).toBeTruthy();

      await advance(55_000);
      expect(screen.getByText('11:00')).toBeTruthy();
      expect(screen.getByText('11 of 30 minutes today')).toBeTruthy();
    });

    it('opens the Book being read', async () => {
      const storage = await openDashboard();
      await storage.library.add({ isbn: '9780441172719', title: 'Dune', authors: [], genres: [] });
      await storage.sessions.start('9780441172719');
      await fireEvent.press(screen.getAllByText('Library')[0]);
      await fireEvent.press(screen.getAllByText('Dashboard')[0]);

      await fireEvent.press(await screen.findByText('Open book'));

      expect(await screen.findByText('Your progress')).toBeTruthy();
    });

    it('rolls over at midnight without anything being reloaded', async () => {
      jest.setSystemTime(new Date('2026-03-11T22:30:00Z')); // 23:30 in Brussels
      const storage = await openDashboard();
      await storage.library.add({ isbn: '9780441172719', title: 'Dune', authors: [], genres: [] });
      await storage.sessions.addManual(
        '9780441172719',
        new Date('2026-03-11T22:00:00Z'),
        new Date('2026-03-11T22:20:00Z'),
      );
      await fireEvent.press(screen.getAllByText('Library')[0]);
      await fireEvent.press(screen.getAllByText('Dashboard')[0]);
      expect(await screen.findAllByText('20 min')).toHaveLength(3);

      await advance(61 * 60 * 1000); // past midnight

      expect(screen.getAllByText('0 min')).toHaveLength(1); // today starts again
      expect(screen.getAllByText('20 min')).toHaveLength(2); // this week and this year carry on
    });
  });
});
