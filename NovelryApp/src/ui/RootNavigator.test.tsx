import { render, screen, fireEvent } from '@testing-library/react-native';
import { openStorage } from '../core/storage/storage';
import { createTestDatabase } from '../core/storage/testDatabase';
import { RootNavigator } from './RootNavigator';

describe('RootNavigator', () => {
  it('starts on the Library tab and can open the other tabs', async () => {
    const storage = await openStorage(createTestDatabase());
    await render(<RootNavigator storage={storage} />);
    expect(await screen.findByText('Your Library is empty')).toBeTruthy();

    for (const [tab, message] of [
      ['Explore', 'Search for your next book.'],
      ['Dashboard', 'Your reading goals and stats.'],
      ['Settings', 'Privacy, support and your data.'],
    ]) {
      await fireEvent.press(screen.getAllByText(tab)[0]);
      expect(screen.getByText(message)).toBeTruthy();
    }
  });
});
