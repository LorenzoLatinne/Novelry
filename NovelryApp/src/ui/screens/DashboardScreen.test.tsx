import { fireEvent, render, screen } from '@testing-library/react-native';
import { createOpenLibraryCatalog } from '../../core/catalog/openLibraryCatalog';
import { openStorage } from '../../core/storage/storage';
import { createTestDatabase } from '../../core/storage/testDatabase';
import { RootNavigator } from '../RootNavigator';

jest.mock('../timeZone', () => ({ deviceTimeZone: () => 'Europe/Brussels' }));

describe('DashboardScreen', () => {
  beforeEach(() => jest.useFakeTimers({ now: new Date('2026-03-11T12:00:00Z'), doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }));
  afterEach(() => jest.useRealTimers());

  async function openDashboard(minutesRead?: number) {
    const storage = await openStorage(createTestDatabase());
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
});
