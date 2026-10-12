import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useAnnounceAchievements } from '../useAnnounceAchievements';
import fellowship from '../../core/catalog/__fixtures__/fellowship.json';
import { createOpenLibraryCatalog } from '../../core/catalog/openLibraryCatalog';
import { openStorage } from '../../core/storage/storage';
import { createTestDatabase } from '../../core/storage/testDatabase';
import { AppServicesProvider } from '../AppServices';
import { RootNavigator } from '../RootNavigator';
import { AchievementsScreen } from './AchievementsScreen';
import { BookDetailScreen } from './BookDetailScreen';

async function readerWhoFinishedABook() {
  const storage = await openStorage(createTestDatabase());
  await storage.library.add({ isbn: '9780261102354', title: 'The Hobbit', authors: [], genres: [] });
  await storage.library.moveToShelf('9780261102354', 'read');
  await storage.sessions.addManual(
    '9780261102354',
    new Date(Date.now() - 2 * 60 * 60 * 1000),
    new Date(Date.now() - 60 * 60 * 1000),
  );
  return storage;
}

const catalog = createOpenLibraryCatalog({ fetch: jest.fn() });

describe('AchievementsScreen', () => {
  afterEach(() => jest.restoreAllMocks());

  it('lists what the Reader has earned and what is still to earn, with progress', async () => {
    const storage = await readerWhoFinishedABook();
    await render(
      <AppServicesProvider services={{ storage, catalog }}>
        <AchievementsScreen />
      </AppServicesProvider>,
    );

    expect(await screen.findByText('2 of 7 earned')).toBeTruthy();
    expect(screen.getByText('Earned')).toBeTruthy();
    expect(screen.getByText('First chapter closed')).toBeTruthy();
    expect(screen.getByText('Lost in a book')).toBeTruthy();
    expect(screen.getByText('Still to earn')).toBeTruthy();
    expect(screen.getByText('Bookshelf builder')).toBeTruthy();
    expect(screen.getByText('1 of 5 books')).toBeTruthy();
    expect(screen.getByLabelText('Bookshelf builder: 1 of 5')).toBeTruthy();
  });

  it('marks new Achievements as new once, and not the next time', async () => {
    const storage = await readerWhoFinishedABook();
    const view = (visit: number) => (
      <AppServicesProvider services={{ storage, catalog }}>
        <AchievementsScreen key={visit} />
      </AppServicesProvider>
    );
    const rendered = await render(view(1));
    expect(await screen.findAllByText('New')).toHaveLength(2);

    await rendered.rerender(view(2)); // visiting the screen again

    await screen.findByText('2 of 7 earned');
    await act(async () => {});
    expect(screen.queryByText('New')).toBeNull();
  });

  it('shows everything as still to earn for a new Reader', async () => {
    const storage = await openStorage(createTestDatabase());
    await render(
      <AppServicesProvider services={{ storage, catalog }}>
        <AchievementsScreen />
      </AppServicesProvider>,
    );

    expect(await screen.findByText('0 of 7 earned')).toBeTruthy();
    expect(screen.queryByText('Earned')).toBeNull();
    expect(screen.getByText('Still to earn')).toBeTruthy();
  });

  it('is reached from the Dashboard, which shows how many are earned', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const storage = await readerWhoFinishedABook();
    await render(<RootNavigator services={{ storage, catalog }} />);
    await fireEvent.press(screen.getAllByText('Dashboard')[0]);

    expect(await screen.findByText('2 of 7 earned')).toBeTruthy();
    await fireEvent.press(screen.getByText('See all'));

    expect(await screen.findByText('Still to earn')).toBeTruthy();
  });
});

describe('telling the Reader about a new Achievement', () => {
  it('shows one notice even when asked twice at the same moment', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const storage = await readerWhoFinishedABook();
    const { result } = await renderHook(() => useAnnounceAchievements(), {
      wrapper: ({ children }) => <AppServicesProvider services={{ storage, catalog }}>{children}</AppServicesProvider>,
    });

    const [first, second] = await Promise.all([result.current(), result.current()]);

    expect(alert).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(first?.filter((a) => a.earned)).toHaveLength(2);
  });

  afterEach(() => jest.restoreAllMocks());

  async function openDetail() {
    const storage = await openStorage(createTestDatabase());
    const detailCatalog = createOpenLibraryCatalog({
      fetch: jest.fn(async () => ({ ok: true, status: 200, json: async () => fellowship })),
    });
    await render(
      <AppServicesProvider services={{ storage, catalog: detailCatalog }}>
        <BookDetailScreen isbn="9780261102354" />
      </AppServicesProvider>,
    );
    await fireEvent.press(await screen.findByText('Add to Library'));
    await screen.findByText('Your progress');
    return storage;
  }

  it('shows a notice when finishing a book earns one, and only once', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const storage = await openDetail();

    await fireEvent.changeText(screen.getByLabelText('Current page'), '545');
    await fireEvent.press(screen.getByText('Save'));
    await screen.findByText('In your Library · Read');

    const notices = () => alert.mock.calls.filter(([title]) => /unlocked/.test(title));
    expect(notices()).toHaveLength(1);
    expect(notices()[0][0]).toBe('Achievement unlocked');
    expect(notices()[0][1]).toContain('First chapter closed: Finish your first book.');
    expect((await storage.achievements.all()).every((a) => a.seen)).toBe(true);

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Favorite' })); // another change, nothing new earned
    await screen.findByText('♥ Favorite');
    expect(notices()).toHaveLength(1);
  });

  it('says nothing when nothing new is earned', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await openDetail();

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Favorite' }));
    await screen.findByText('♥ Favorite');

    expect(alert.mock.calls.filter(([title]) => /unlocked/.test(title))).toHaveLength(0);
  });
});
