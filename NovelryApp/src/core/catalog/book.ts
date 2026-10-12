export type Book = {
  isbn: string;
  title: string;
  authors: string[];
  genres: string[];
  pageCount?: number;
  publishedYear?: number;
  coverUrl?: string;
  description?: string;
};
