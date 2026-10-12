import { fireEvent, render, screen } from '@testing-library/react-native';
import { createOpenLibraryCatalog } from '../../core/catalog/openLibraryCatalog';
import { openStorage } from '../../core/storage/storage';
import { createTestDatabase } from '../../core/storage/testDatabase';
import { RootNavigator } from '../RootNavigator';

const dune = { isbn: '9780441172719', title: 'Dune', authors: ['Frank Herbert'], genres: ['Science Fiction'] };
const doc = (title: string, isbn: string) => ({ title, author_name: ['Some Author'], isbn: [isbn], subject: ['Science Fiction'] });

function fakeOpenLibrary(docs: ReturnType<typeof doc>[]) {
  return jest.fn(async (url: string) => ({
    ok: true,
    status: 200,
    json: async () => {
      if (/bibkeys=/.test(url)) {
        const requested = url.match(/bibkeys=(ISBN:\d+)/)![1];
        return { [requested]: { title: 'A recommended book', authors: [{ name: 'Some Author' }] } };
      }
      return { numFound: docs.length, docs };
    },
  }));
}

async function openExplore(options: { taste?: boolean; fetch: jest.Mock }) {
  const storage = await openStorage(createTestDatabase());
  if (options.taste) {
    await storage.library.add(dune);
    await storage.library.moveToShelf(dune.isbn, 'read');
    await storage.reviews.save(dune.isbn, { rating: 5, comment: '' });
  }
  const catalog = createOpenLibraryCatalog({ fetch: options.fetch });
  await render(<RootNavigator services={{ storage, catalog }} />);
  await fireEvent.press(screen.getAllByText('Explore')[0]);
  return storage;
}

describe('RecommendationsSection', () => {
  it('explains what will appear once the Reader has some reading behind them', async () => {
    const fetch = fakeOpenLibrary([]);
    await openExplore({ fetch });

    expect(await screen.findByText('Recommendations will appear here')).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows recommendations, each with the reason', async () => {
    await openExplore({ taste: true, fetch: fakeOpenLibrary([doc('Hyperion', '9780553283686'), doc('Neuromancer', '9780441569595')]) });

    expect(await screen.findByText('Recommended for you')).toBeTruthy();
    expect(screen.getByText('Hyperion')).toBeTruthy();
    expect(screen.getByText('Neuromancer')).toBeTruthy();
    expect(screen.getAllByText('Because you rated “Dune” 5 stars · Science Fiction')).toHaveLength(2);
  });

  it('never recommends what is already in the Library', async () => {
    const storage = await openExplore({ taste: true, fetch: fakeOpenLibrary([doc('Hyperion', '9780553283686'), doc('Neuromancer', '9780441569595')]) });
    await screen.findByText('Hyperion');

    await storage.library.add({ isbn: '9780553283686', title: 'Hyperion', authors: [], genres: [] });
    await fireEvent.press(screen.getAllByText('Library')[0]);
    await fireEvent.press(screen.getAllByText('Explore')[0]);

    await screen.findByText('Neuromancer');
    expect(screen.queryByText('Hyperion')).toBeNull();
  });

  it('opens a recommended Book', async () => {
    await openExplore({ taste: true, fetch: fakeOpenLibrary([doc('Hyperion', '9780553283686')]) });

    await fireEvent.press(await screen.findByText('Hyperion'));

    expect(await screen.findByText('Add to Library')).toBeTruthy();
  });

  it('forgets a Book the Reader is not interested in, for good', async () => {
    const storage = await openExplore({ taste: true, fetch: fakeOpenLibrary([doc('Hyperion', '9780553283686'), doc('Neuromancer', '9780441569595')]) });
    await screen.findByText('Hyperion');

    await fireEvent.press(screen.getByRole('button', { name: 'Not interested in Hyperion' }));

    expect(screen.queryByText('Hyperion')).toBeNull();
    expect(screen.getByText('Neuromancer')).toBeTruthy();
    expect(await storage.dismissals.all()).toEqual(['9780553283686']);

    // coming back to the tab: still gone
    await fireEvent.press(screen.getAllByText('Library')[0]);
    await fireEvent.press(screen.getAllByText('Explore')[0]);
    await screen.findByText('Neuromancer');
    expect(screen.queryByText('Hyperion')).toBeNull();
  });

  it('says so when everything that fits has been seen or dismissed', async () => {
    const storage = await openExplore({ taste: true, fetch: fakeOpenLibrary([doc('Hyperion', '9780553283686')]) });
    await screen.findByText('Hyperion');

    await fireEvent.press(screen.getByRole('button', { name: 'Not interested in Hyperion' }));
    await fireEvent.press(screen.getAllByText('Library')[0]);
    await fireEvent.press(screen.getAllByText('Explore')[0]);

    expect(await screen.findByText('Nothing new to recommend right now')).toBeTruthy();
    expect(await storage.dismissals.all()).toHaveLength(1);
  });

  it('explains when the Reader is offline, and tries again on request', async () => {
    const fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await openExplore({ taste: true, fetch });

    expect(await screen.findByText(/You seem to be offline/)).toBeTruthy();

    fetch.mockImplementation(fakeOpenLibrary([doc('Hyperion', '9780553283686')]));
    await fireEvent.press(screen.getByText('Try again'));

    expect(await screen.findByText('Hyperion')).toBeTruthy();
  });

  it('is replaced by the results while the Reader is searching', async () => {
    await openExplore({ taste: true, fetch: fakeOpenLibrary([doc('Hyperion', '9780553283686')]) });
    await screen.findByText('Hyperion');

    await fireEvent.changeText(screen.getByLabelText('Search books'), 'tolkien');

    expect(screen.queryByText('Recommended for you')).toBeNull();
  });
});
