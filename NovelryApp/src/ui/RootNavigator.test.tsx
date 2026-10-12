import { render, screen, fireEvent } from '@testing-library/react-native';
import { createOpenLibraryCatalog } from '../core/catalog/openLibraryCatalog';
import { openStorage } from '../core/storage/storage';
import { createTestDatabase } from '../core/storage/testDatabase';
import { RootNavigator } from './RootNavigator';

describe('RootNavigator', () => {
  it('starts on the Library tab and can open the other tabs', async () => {
    const storage = await openStorage(createTestDatabase());
    const catalog = createOpenLibraryCatalog({ fetch: jest.fn() });
    await render(<RootNavigator services={{ storage, catalog }} />);
    expect(await screen.findByText('Your Library is empty')).toBeTruthy();

    for (const [tab, message] of [
      ['Explore', 'Search for a book by title or author.'],
      ['Dashboard', 'Your reading goals and stats.'],
      ['Settings', 'Privacy, support and your data.'],
    ]) {
      await fireEvent.press(screen.getAllByText(tab)[0]);
      expect(screen.getByText(message)).toBeTruthy();
    }
  });
});
