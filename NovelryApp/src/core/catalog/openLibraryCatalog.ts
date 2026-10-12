import type { Book } from './book';

const BASE_URL = 'https://openlibrary.org';
const MAX_GENRES = 5;

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
  constructor(status: number) {
    super(`Open Library is not available right now (status ${status}).`);
    this.name = 'CatalogUnavailableError';
  }
}

function normalizeIsbn(input: string): string {
  return input.replace(/[\s-]/g, '');
}

export function createOpenLibraryCatalog(options: { fetch: FetchLike }): BookCatalog {
  const found = new Map<string, Book>();

  return {
    async getBookByIsbn(input) {
      const isbn = normalizeIsbn(input);
      const cached = found.get(isbn);
      if (cached) {
        return cached;
      }

      const url = `${BASE_URL}/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
      let response: FetchResponse;
      try {
        response = await options.fetch(url);
      } catch {
        throw new CatalogOfflineError();
      }
      if (!response.ok) {
        throw new CatalogUnavailableError(response.status);
      }

      const payload = (await response.json()) as Record<string, OpenLibraryBook>;
      const raw = payload[`ISBN:${isbn}`];
      if (!raw?.title) {
        return null;
      }
      const book = toBook(isbn, raw);
      found.set(isbn, book);
      return book;
    },
  };
}

function toBook(isbn: string, raw: OpenLibraryBook): Book {
  const year = raw.publish_date?.match(/\d{4}/)?.[0];
  return {
    isbn,
    title: raw.title ?? '',
    authors: (raw.authors ?? []).map((a) => a.name),
    genres: (raw.subjects ?? []).map((s) => s.name).slice(0, MAX_GENRES),
    ...(raw.number_of_pages ? { pageCount: raw.number_of_pages } : {}),
    ...(year ? { publishedYear: Number(year) } : {}),
    ...(raw.cover?.medium ? { coverUrl: raw.cover.medium } : {}),
  };
}
