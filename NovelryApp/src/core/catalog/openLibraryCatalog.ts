import type { Book } from './book';

const BASE_URL = 'https://openlibrary.org';
const MAX_GENRES = 5;
const SEARCH_PAGE_SIZE = 20;
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

type OpenLibrarySearchDoc = {
  title?: string;
  author_name?: string[];
  subject?: string[];
  isbn?: string[];
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
};

type OpenLibrarySearchResponse = { numFound?: number; docs?: OpenLibrarySearchDoc[] };

export type SearchResult = { books: Book[]; total: number };

export interface BookCatalog {
  getBookByIsbn(isbn: string): Promise<Book | null>;
  searchBooks(query: string, options?: { page?: number }): Promise<SearchResult>;
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

  async function getJson<T>(url: string): Promise<T> {
    let response: FetchResponse;
    try {
      response = await options.fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    } catch {
      throw new CatalogOfflineError();
    }
    if (!response.ok) {
      throw new CatalogUnavailableError(`status ${response.status}`);
    }
    try {
      return (await response.json()) as T;
    } catch {
      throw new CatalogUnavailableError('unreadable response');
    }
  }

  return {
    async getBookByIsbn(input) {
      const isbn = normalizeIsbn(input);
      const cached = booksByIsbn.get(isbn);
      if (cached) {
        return cached;
      }

      const payload = await getJson<Record<string, OpenLibraryBook>>(
        `${BASE_URL}/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
      );
      const raw = payload[`ISBN:${isbn}`];
      const title = raw?.title;
      if (!title) {
        return null;
      }
      const book = toBook(isbn, title, raw);
      booksByIsbn.set(isbn, book);
      return book;
    },

    async searchBooks(query, { page = 1 } = {}) {
      const trimmed = query.trim();
      if (!trimmed) {
        return { books: [], total: 0 };
      }

      const fields =
        'title,author_name,subject,isbn,cover_i,first_publish_year,number_of_pages_median';
      const payload = await getJson<OpenLibrarySearchResponse>(
        `${BASE_URL}/search.json?q=${encodeURIComponent(trimmed)}&page=${page}&limit=${SEARCH_PAGE_SIZE}&fields=${fields}`,
      );
      return {
        books: (payload.docs ?? []).flatMap((doc) => {
          const book = searchDocToBook(doc);
          return book ? [book] : [];
        }),
        total: payload.numFound ?? 0,
      };
    },
  };
}

function searchDocToBook(doc: OpenLibrarySearchDoc): Book | null {
  const isbns = doc.isbn ?? [];
  const isbn = isbns.find((candidate) => candidate.length === 13) ?? isbns[0];
  if (!doc.title || !isbn) {
    return null;
  }
  return {
    isbn,
    title: doc.title,
    authors: doc.author_name ?? [],
    genres: (doc.subject ?? []).slice(0, MAX_GENRES),
    ...(doc.number_of_pages_median ? { pageCount: doc.number_of_pages_median } : {}),
    ...(doc.first_publish_year ? { publishedYear: doc.first_publish_year } : {}),
    ...(doc.cover_i ? { coverUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` } : {}),
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
