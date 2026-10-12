import type { Book } from './book';

const BASE_URL = 'https://openlibrary.org';
const MAX_GENRES = 5;
/** Open Library asks API clients to identify themselves. */
const USER_AGENT = 'Novelry/0.1 (+https://github.com/LorenzoLatinne/Novelry)';

type FetchResponse = { ok: boolean; status: number; json(): Promise<unknown> };
type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<FetchResponse>;

type OpenLibraryBook = {
  title?: string;
  authors?: { name: string }[];
  subjects?: { name: string }[];
  number_of_pages?: number;
  publish_date?: string;
  cover?: { medium?: string };
};

export interface BookCatalog {
  getBookByIsbn(isbn: string): Promise<Book | null>;
}

/** The Reader has no internet connection (or Open Library cannot be reached). */
export class CatalogOfflineError extends Error {
  constructor() {
    super('Could not reach Open Library. Check your internet connection.');
    this.name = 'CatalogOfflineError';
  }
}

/** Open Library answered, but with an error. */
export class CatalogUnavailableError extends Error {
  constructor(detail: string) {
    super(`Open Library is not available right now (${detail}).`);
    this.name = 'CatalogUnavailableError';
  }
}

function normalizeIsbn(input: string): string {
  return input.replace(/[\s-]/g, '');
}

export function createOpenLibraryCatalog(options: { fetch: FetchLike }): BookCatalog {
  const booksByIsbn = new Map<string, Book>();

  return {
    async getBookByIsbn(input) {
      const isbn = normalizeIsbn(input);
      const cached = booksByIsbn.get(isbn);
      if (cached) {
        return cached;
      }

      const url = `${BASE_URL}/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
      let response: FetchResponse;
      try {
        response = await options.fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      } catch {
        throw new CatalogOfflineError();
      }
      if (!response.ok) {
        throw new CatalogUnavailableError(`status ${response.status}`);
      }

      let payload: Record<string, OpenLibraryBook>;
      try {
        payload = (await response.json()) as Record<string, OpenLibraryBook>;
      } catch {
        throw new CatalogUnavailableError('unreadable response');
      }
      const raw = payload[`ISBN:${isbn}`];
      const title = raw?.title;
      if (!title) {
        return null;
      }
      const book = toBook(isbn, title, raw);
      booksByIsbn.set(isbn, book);
      return book;
    },
  };
}

function toBook(isbn: string, title: string, raw: OpenLibraryBook): Book {
  const year = raw.publish_date?.match(/\d{4}/)?.[0];
  return {
    isbn,
    title,
    authors: (raw.authors ?? []).map((a) => a.name),
    genres: (raw.subjects ?? []).map((s) => s.name).slice(0, MAX_GENRES),
    ...(raw.number_of_pages ? { pageCount: raw.number_of_pages } : {}),
    ...(year ? { publishedYear: Number(year) } : {}),
    ...(raw.cover?.medium ? { coverUrl: raw.cover.medium } : {}),
  };
}
