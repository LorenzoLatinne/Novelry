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

  async function openDashboard(minutesRead?: number, finishedBooks = 0, goal?: number) {
    const storage = await openStorage(createTestDatabase());
    for (let i = 0; i < finishedBooks; i++) {
      const isbn = `97800000000${i}0`;
      await storage.library.add({ isbn, title: `Book ${i}`, authors: [], genres: [] });
      await storage.library.moveToShelf(isbn, 'read');
    }
    if (goal) {
      await storage.goals.setYearlyBooks(goal);
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
    await openDashboard(25);

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
    await openDashboard(185);

    expect(await screen.findAllByText('3 h 05 min')).toHaveLength(3);
  });

  describe('yearly goal', () => {
    afterEach(() => jest.restoreAllMocks());

    it('invites the Reader to set a goal, and shows progress once set', async () => {
      const storage = await openDashboard(undefined, 2);
      expect(await screen.findByText('Set a reading goal for 2026')).toBeTruthy();

      await fireEvent.changeText(screen.getByLabelText('Books to read this year'), '8');
      await fireEvent.press(screen.getByText('Set goal'));

      expect(await screen.findByText('Reading goal 2026')).toBeTruthy();
      expect(screen.getByText('2 of 8 books')).toBeTruthy();
      expect(screen.getByText('25% of the way there')).toBeTruthy();
      expect(await storage.goals.getYearlyBooks()).toBe(8);
    });

    it('shows a reached goal', async () => {
      await openDashboard(undefined, 3, 3);

      expect(await screen.findByText('3 of 3 books')).toBeTruthy();
      expect(screen.getByText('Goal reached. Well done!')).toBeTruthy();
    });

    it('changes the target', async () => {
      const storage = await openDashboard(undefined, 1, 5);
      await screen.findByText('1 of 5 books');

      await fireEvent.press(screen.getByText('Change goal'));
      await fireEvent.changeText(screen.getByLabelText('Books to read this year'), '10');
      await fireEvent.press(screen.getByText('Save'));

      expect(await screen.findByText('1 of 10 books')).toBeTruthy();
      expect(await storage.goals.getYearlyBooks()).toBe(10);
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
      const storage = await openDashboard(undefined, 1, 5);
      await screen.findByText('1 of 5 books');

      await fireEvent.press(screen.getByText('Remove goal'));
      expect(await storage.goals.getYearlyBooks()).toBe(5);

      const confirm = alert.mock.calls[0][2]!.find((b) => b.text === 'Remove')!;
      await act(async () => confirm.onPress!());

      expect(await screen.findByText('Set a reading goal for 2026')).toBeTruthy();
      expect(await storage.goals.getYearlyBooks()).toBeNull();
    });
  });
});
