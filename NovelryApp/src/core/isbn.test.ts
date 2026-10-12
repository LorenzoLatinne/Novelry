import { parseIsbn } from './isbn';

describe('parseIsbn', () => {
  it('accepts a valid ISBN-13 and ignores hyphens and spaces', () => {
    expect(parseIsbn('9780261102354')).toBe('9780261102354');
    expect(parseIsbn(' 978-0-261-10235-4 ')).toBe('9780261102354');
  });

  it('converts a valid ISBN-10 to its ISBN-13 so the same Book is never stored twice', () => {
    expect(parseIsbn('0261102354')).toBe('9780261102354');
    expect(parseIsbn('0-8044-2957-X')).toBe('9780804429573');
    expect(parseIsbn('080442957x')).toBe('9780804429573');
  });

  it('rejects numbers with a wrong check digit', () => {
    expect(parseIsbn('9780261102355')).toBeNull();
    expect(parseIsbn('0261102355')).toBeNull();
  });

  it('rejects barcodes that are not books', () => {
    expect(parseIsbn('5901234123457')).toBeNull();
  });

  it('rejects anything that is not an ISBN', () => {
    expect(parseIsbn('')).toBeNull();
    expect(parseIsbn('hobbit')).toBeNull();
    expect(parseIsbn('12345')).toBeNull();
  });
});
