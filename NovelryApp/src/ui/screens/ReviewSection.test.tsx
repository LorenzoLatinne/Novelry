import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import fellowship from '../../core/catalog/__fixtures__/fellowship.json';
import { createOpenLibraryCatalog } from '../../core/catalog/openLibraryCatalog';
import { openStorage } from '../../core/storage/storage';
import { createTestDatabase } from '../../core/storage/testDatabase';
import { AppServicesProvider } from '../AppServices';
import { BookDetailScreen } from './BookDetailScreen';

const ISBN = '9780261102354';

async function openWithBook() {
  const storage = await openStorage(createTestDatabase());
  const catalog = createOpenLibraryCatalog({
    fetch: jest.fn(async () => ({ ok: true, status: 200, json: async () => fellowship })),
  });
  await render(
    <AppServicesProvider services={{ storage, catalog }}>
      <BookDetailScreen isbn={ISBN} />
    </AppServicesProvider>,
  );
  await fireEvent.press(await screen.findByText('Add to Library'));
  await screen.findByText('Your review');
  return storage;
}

describe('Review section', () => {
  afterEach(() => jest.restoreAllMocks());

  it('saves a Rating and a comment, privately', async () => {
    const storage = await openWithBook();
    expect(screen.getByText('Only you can see this.')).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: '4 stars' }));
    await fireEvent.changeText(screen.getByLabelText('Review comment'), 'Gripping.');
    await fireEvent.press(screen.getByText('Save review'));

    expect(await screen.findByText('Review saved.')).toBeTruthy();
    expect(await storage.reviews.get(ISBN)).toMatchObject({ rating: 4, comment: 'Gripping.' });
  });

  it('asks for a Rating before saving', async () => {
    const storage = await openWithBook();

    await fireEvent.changeText(screen.getByLabelText('Review comment'), 'No stars yet');
    await fireEvent.press(screen.getByText('Save review'));

    expect(await screen.findByText('Choose a Rating from 1 to 5 stars.')).toBeTruthy();
    expect(await storage.reviews.get(ISBN)).toBeNull();
  });

  it('shows the saved Review again and lets the Reader change it', async () => {
    const storage = await openStorage(createTestDatabase());
    await storage.library.add({ isbn: ISBN, title: 'The Fellowship of the Ring', authors: [], genres: [] });
    await storage.reviews.save(ISBN, { rating: 3, comment: 'Okay.' });
    const catalog = createOpenLibraryCatalog({ fetch: jest.fn() });
    await render(
      <AppServicesProvider services={{ storage, catalog }}>
        <BookDetailScreen isbn={ISBN} />
      </AppServicesProvider>,
    );
    await screen.findByText('Your review');

    expect(screen.getByLabelText('Review comment').props.value).toBe('Okay.');
    expect(screen.getByRole('radio', { name: '3 stars' }).props.accessibilityState).toMatchObject({ checked: true });

    await fireEvent.press(screen.getByRole('radio', { name: '5 stars' }));
    await fireEvent.changeText(screen.getByLabelText('Review comment'), 'A classic.');
    await fireEvent.press(screen.getByText('Save review'));

    await screen.findByText('Review saved.');
    expect(await storage.reviews.get(ISBN)).toMatchObject({ rating: 5, comment: 'A classic.' });
  });

  it('keeps what the Reader is typing when the screen reloads for another reason', async () => {
    const storage = await openWithBook();
    await fireEvent.press(screen.getByRole('radio', { name: '2 stars' }));
    await fireEvent.press(screen.getByText('Save review'));
    await screen.findByText('Review saved.');

    await fireEvent.changeText(screen.getByLabelText('Review comment'), 'Still thinking about it');
    await fireEvent.press(screen.getByRole('radio', { name: 'Reading' })); // reloads the screen

    await screen.findByText('In your Library · Reading');
    expect(screen.getByLabelText('Review comment').props.value).toBe('Still thinking about it');
    expect((await storage.reviews.get(ISBN))?.comment).toBe('');
  });

  it('clears the saved message once the Reader edits again', async () => {
    await openWithBook();
    await fireEvent.press(screen.getByRole('radio', { name: '4 stars' }));
    await fireEvent.press(screen.getByText('Save review'));
    await screen.findByText('Review saved.');

    await fireEvent.changeText(screen.getByLabelText('Review comment'), 'More thoughts');

    expect(screen.queryByText('Review saved.')).toBeNull();
  });

  it('says so when the Review cannot be saved', async () => {
    const storage = await openWithBook();
    jest.spyOn(storage.reviews, 'save').mockRejectedValue(new Error('disk full'));
    await fireEvent.press(screen.getByRole('radio', { name: '4 stars' }));

    await fireEvent.press(screen.getByText('Save review'));

    expect(await screen.findByText('Could not save your review. Please try again.')).toBeTruthy();
  });

  it('deletes a Review only after the Reader confirms', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const storage = await openWithBook();
    await fireEvent.press(screen.getByRole('radio', { name: '2 stars' }));
    await fireEvent.press(screen.getByText('Save review'));
    await screen.findByText('Delete review');

    await fireEvent.press(screen.getByText('Delete review'));
    expect(await storage.reviews.get(ISBN)).not.toBeNull();

    const confirm = alert.mock.calls[0][2]!.find((b) => b.text === 'Delete')!;
    await act(async () => confirm.onPress!());

    expect(await storage.reviews.get(ISBN)).toBeNull();
    expect(screen.queryByText('Delete review')).toBeNull();
    expect(screen.getByLabelText('Review comment').props.value).toBe('');
  });
});
