import { render, screen, fireEvent } from '@testing-library/react-native';
import { RootNavigator } from './RootNavigator';

describe('RootNavigator', () => {
  it('starts on the Library tab and can open the other tabs', async () => {
    await render(<RootNavigator />);
    expect(screen.getByText('Your books will appear here.')).toBeTruthy();

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
