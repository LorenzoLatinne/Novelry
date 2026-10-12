import { fireEvent, render, screen } from '@testing-library/react-native';
import { createOpenLibraryCatalog } from '../../core/catalog/openLibraryCatalog';
import { openStorage } from '../../core/storage/storage';
import { createTestDatabase } from '../../core/storage/testDatabase';
import { AppServicesProvider } from '../AppServices';
import { SettingsScreen } from './SettingsScreen';

const mockWritten: { name: string; text: string; options: unknown }[] = [];
const mockShare = jest.fn();
const mockAvailable = jest.fn();

jest.mock('expo-file-system', () => ({
  Paths: { cache: Object.assign('file:///cache', { list: () => [] }) },
  File: class {
    uri: string;
    private name: string;
    constructor(dir: string, name?: string) {
      this.name = name ?? dir;
      this.uri = name ? `${dir}/${name}` : dir;
    }
    delete() {}
    create(options: unknown) {
      mockWritten.push({ name: this.name, text: '', options });
    }
    write(text: string) {
      mockWritten[mockWritten.length - 1].text = text;
    }
  },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: () => mockAvailable(),
  shareAsync: (...args: unknown[]) => mockShare(...args),
}));

async function openSettings() {
  const storage = await openStorage(createTestDatabase());
  await storage.library.add({ isbn: '9780441172719', title: 'Dune', authors: ['Frank Herbert'], genres: ['Science Fiction'] });
  await storage.reviews.save('9780441172719', { rating: 5, comment: 'Superb.' });
  const catalog = createOpenLibraryCatalog({ fetch: jest.fn() });
  await render(
    <AppServicesProvider services={{ storage, catalog }}>
      <SettingsScreen />
    </AppServicesProvider>,
  );
}

beforeEach(() => {
  mockWritten.length = 0;
  mockShare.mockReset().mockResolvedValue(undefined);
  mockAvailable.mockReset().mockResolvedValue(true);
});

describe('SettingsScreen: export', () => {
  it('writes the Reader’s data to a versioned JSON file and opens the share sheet for it', async () => {
    await openSettings();

    await fireEvent.press(screen.getByText('Export my data'));

    expect(await screen.findByText(/Your export file is ready/)).toBeTruthy();
    expect(mockWritten).toHaveLength(1);
    expect(mockWritten[0].name).toMatch(/^novelry-export-\d{4}-\d{2}-\d{2}\.json$/);
    expect(mockWritten[0].options).toEqual({ overwrite: true });
    const content = JSON.parse(mockWritten[0].text);
    expect(content).toMatchObject({ format: 'novelry-export', schemaVersion: 1 });
    expect(content.library).toHaveLength(1);
    expect(content.reviews[0]).toMatchObject({ rating: 5, comment: 'Superb.' });
    expect(mockShare).toHaveBeenCalledWith(
      `file:///cache/${mockWritten[0].name}`,
      expect.objectContaining({ mimeType: 'application/json', UTI: 'public.json' }),
    );
  });

  it('says so when this phone cannot share files, and shares nothing', async () => {
    mockAvailable.mockResolvedValue(false);
    await openSettings();

    await fireEvent.press(screen.getByText('Export my data'));

    expect(await screen.findByText('This phone cannot share files right now.')).toBeTruthy();
    expect(mockShare).not.toHaveBeenCalled();
  });

  it('says so when the export fails, and can be tried again', async () => {
    mockShare.mockRejectedValueOnce(new Error('boom'));
    await openSettings();

    await fireEvent.press(screen.getByText('Export my data'));
    expect(await screen.findByText('Could not export your data. Please try again.')).toBeTruthy();

    await fireEvent.press(screen.getByText('Export my data'));
    expect(await screen.findByText(/Your export file is ready/)).toBeTruthy();
  });

  it('cannot be started twice while it is working', async () => {
    let finishSharing: () => void = () => {};
    mockShare.mockReturnValue(new Promise<void>((resolve) => (finishSharing = resolve)));
    await openSettings();

    void fireEvent.press(screen.getByText('Export my data')); // not awaited: it stays busy until we let it finish
    expect(await screen.findByLabelText('Preparing your export')).toBeTruthy();
    expect(screen.queryByText('Export my data')).toBeNull();

    finishSharing();
    expect(await screen.findByText(/Your export file is ready/)).toBeTruthy();
    expect(mockWritten).toHaveLength(1);
  });

  it('explains that the data lives on this phone', async () => {
    await openSettings();

    expect(screen.getByText(/stored on this phone/)).toBeTruthy();
  });
});
