import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import fellowship from '../../core/catalog/__fixtures__/fellowship.json';
import { createOpenLibraryCatalog } from '../../core/catalog/openLibraryCatalog';
import { openStorage } from '../../core/storage/storage';
import { createTestDatabase } from '../../core/storage/testDatabase';
import { RootNavigator } from '../RootNavigator';

let mockScanned: ((event: { data: string }) => void) | undefined;
let mockPermission: { granted: boolean; canAskAgain: boolean } | null = null;
const mockRequestPermission = jest.fn();

jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [mockPermission, mockRequestPermission],
  CameraView: (props: { onBarcodeScanned: (event: { data: string }) => void }) => {
    mockScanned = props.onBarcodeScanned;
    return null;
  },
}));

async function openScanner() {
  const storage = await openStorage(createTestDatabase());
  const fetch = jest.fn(async (url: string) => ({
    ok: true,
    status: 200,
    json: async () => ({ [url.match(/bibkeys=(ISBN:\d+)/)![1]]: fellowship['ISBN:9780261102354'] }),
  }));
  const catalog = createOpenLibraryCatalog({ fetch });
  await render(<RootNavigator services={{ storage, catalog }} />);
  await fireEvent.press(screen.getAllByText('Explore')[0]);
  await fireEvent.press(screen.getByText('Scan a barcode instead'));
  return fetch;
}

beforeEach(() => {
  mockScanned = undefined;
  mockRequestPermission.mockReset();
});

describe('ScanScreen', () => {
  it('explains why the camera is needed and asks for permission', async () => {
    mockPermission = { granted: false, canAskAgain: true };
    await openScanner();

    expect(screen.getByText(/uses your camera only to read the barcode/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Allow camera'));

    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('points to settings when the camera was denied, and manual entry still works', async () => {
    mockPermission = { granted: false, canAskAgain: false };
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    await openScanner();

    await fireEvent.press(screen.getByText('Open settings'));
    expect(openSettings).toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('ISBN'), '9780261102354');
    await fireEvent.press(screen.getByText('Look up'));
    expect(await screen.findByText('The Fellowship of the Ring')).toBeTruthy();
  });

  it('opens the Book for a scanned ISBN barcode', async () => {
    mockPermission = { granted: true, canAskAgain: true };
    const fetch = await openScanner();

    await act(async () => mockScanned!({ data: '9780261102354' }));

    expect(await screen.findByText('The Fellowship of the Ring')).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('ISBN:9780261102354'), expect.anything());
  });

  it('says so when a scanned barcode is not a book', async () => {
    mockPermission = { granted: true, canAskAgain: true };
    const fetch = await openScanner();

    await act(async () => mockScanned!({ data: '5901234123457' }));

    expect(await screen.findByText(/doesn’t look like a book barcode/)).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('looks up a typed ISBN-10 by its ISBN-13', async () => {
    mockPermission = { granted: false, canAskAgain: true };
    const fetch = await openScanner();

    await fireEvent.changeText(screen.getByLabelText('ISBN'), '0-261-10235-4');
    await fireEvent.press(screen.getByText('Look up'));

    expect(await screen.findByText('The Fellowship of the Ring')).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('ISBN:9780261102354'), expect.anything());
  });

  it('rejects a typed number that is not a valid ISBN', async () => {
    mockPermission = { granted: false, canAskAgain: true };
    const fetch = await openScanner();

    await fireEvent.changeText(screen.getByLabelText('ISBN'), '9780261102355');
    await fireEvent.press(screen.getByText('Look up'));

    expect(await screen.findByText(/isn’t a valid ISBN/)).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });
});
