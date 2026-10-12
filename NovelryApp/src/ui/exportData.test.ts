import { openStorage } from '../core/storage/storage';
import { createTestDatabase } from '../core/storage/testDatabase';
import { exportAndShare, SharingUnavailableError, type ExportFileOps } from './exportData';

const NOW = new Date('2026-06-01T12:00:00.000Z');

/** A fake file layer that remembers what was written, kept and removed. */
function fakeOps(overrides: Partial<ExportFileOps> = {}) {
  const files = new Map<string, string>([
    ['file:///cache/novelry-export-2026-05-01.json', 'old'],
    ['file:///cache/something-else.txt', 'unrelated'],
  ]);
  const ops: ExportFileOps = {
    writeFile: (name, text) => {
      files.set(`file:///cache/${name}`, text);
      return `file:///cache/${name}`;
    },
    removeFile: (uri) => void files.delete(uri),
    removeOldExports: (keepUri) => {
      for (const uri of [...files.keys()]) {
        if (/novelry-export-.*\.json$/.test(uri) && uri !== keepUri) {
          files.delete(uri);
        }
      }
    },
    isSharingAvailable: async () => true,
    share: jest.fn(async () => {}),
    ...overrides,
  };
  return { ops, files };
}

async function storageWithABook() {
  const storage = await openStorage(createTestDatabase());
  await storage.library.add({ isbn: '9780441172719', title: 'Dune', authors: [], genres: [] });
  return storage;
}

describe('exportAndShare', () => {
  it('writes the whole export to a file and shares that file', async () => {
    const { ops, files } = fakeOps();

    await exportAndShare(await storageWithABook(), NOW, ops);

    const uri = 'file:///cache/novelry-export-2026-06-01.json';
    expect(JSON.parse(files.get(uri)!)).toMatchObject({ format: 'novelry-export', schemaVersion: 1 });
    expect(ops.share).toHaveBeenCalledWith(uri);
  });

  it('clears out earlier export files, which hold older copies of the Reader’s history, but nothing else', async () => {
    const { ops, files } = fakeOps();

    await exportAndShare(await storageWithABook(), NOW, ops);

    expect([...files.keys()].sort()).toEqual([
      'file:///cache/novelry-export-2026-06-01.json',
      'file:///cache/something-else.txt',
    ]);
  });

  it('leaves no copy behind when sharing fails', async () => {
    const { ops, files } = fakeOps({ share: jest.fn().mockRejectedValue(new Error('boom')) });

    await expect(exportAndShare(await storageWithABook(), NOW, ops)).rejects.toThrow('boom');

    expect(files.has('file:///cache/novelry-export-2026-06-01.json')).toBe(false);
  });

  it('shares nothing, and leaves no copy, when this phone cannot share files', async () => {
    const { ops, files } = fakeOps({ isSharingAvailable: async () => false });

    await expect(exportAndShare(await storageWithABook(), NOW, ops)).rejects.toBeInstanceOf(SharingUnavailableError);

    expect(ops.share).not.toHaveBeenCalled();
    expect(files.has('file:///cache/novelry-export-2026-06-01.json')).toBe(false);
  });

  it('leaves no copy behind when the file cannot be written', async () => {
    const { ops } = fakeOps({
      writeFile: () => {
        throw new Error('disk full');
      },
    });

    await expect(exportAndShare(await storageWithABook(), NOW, ops)).rejects.toThrow('disk full');
    expect(ops.share).not.toHaveBeenCalled();
  });

  it('carries its own explanation when sharing is unavailable', () => {
    expect(new SharingUnavailableError().message).toBe('This phone cannot share files right now.');
  });
});
