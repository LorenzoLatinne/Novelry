import type { Book } from './catalog/book';
import type { Storage } from './storage/storage';

/** A Book the Reader has shown a taste about: finished, rated or marked as a Favorite. */
export type TasteBook = Book & {
  /** When the Reader last finished it, or null. */
  finishedAt: string | null;
  /** The Reader's Rating, 1-5, or null. */
  rating: number | null;
  ratedAt: string | null;
  favorite: boolean;
};

export type Recommendation = {
  book: Book;
  /** Higher is a better match. Only matches above zero are recommended. */
  score: number;
  /** A plain-language reason the Reader can read, built from the same numbers as the score. */
  reason: string;
};

export type RecommendOptions = {
  now: Date;
  /** Books never to suggest: in the Library, or dismissed by the Reader. */
  excluded: Set<string>;
  /** At most this many recommendations. */
  limit?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** Reading from this many days ago counts half as much as reading today. */
const HALF_LIFE_DAYS = 180;
const DEFAULT_LIMIT = 20;
/** Open Library subjects that say nothing about what a Reader likes. */
const CATCH_ALL_GENRES = new Set([
  'fiction',
  'nonfiction',
  'non-fiction',
  'accessible book',
  'protected daisy',
  'in library',
  'large type books',
  'open library staff picks',
]);

const normalize = (genre: string) => genre.trim().toLowerCase();

/** A Book's genres, without catch-alls or repeats, remembering how each was written. */
function meaningfulGenres(genres: string[]): Map<string, string> {
  const result = new Map<string, string>();
  for (const genre of genres) {
    const key = normalize(genre);
    if (key && !CATCH_ALL_GENRES.has(key) && !result.has(key)) {
      result.set(key, genre.trim());
    }
  }
  return result;
}

/** How much a Book says about the Reader's taste: positive if liked, negative if disliked, fading with time. */
function tasteWeight(book: TasteBook, now: Date): number {
  const ratingBonus = book.rating === null ? 0 : (book.rating - 3) / 2;
  const base = (book.finishedAt ? 1 : 0) + (book.favorite ? 1 : 0) + ratingBonus;
  const dates = [book.finishedAt, book.ratedAt].filter((d): d is string => d !== null).map(Date.parse);
  if (dates.length === 0) {
    return base;
  }
  const ageDays = Math.max(0, (now.getTime() - Math.max(...dates)) / DAY_MS);
  return base * 0.5 ** (ageDays / HALF_LIFE_DAYS);
}

/** Whether the Reader clearly liked a Book, which makes its author worth a boost. */
const likedAuthorsBook = (book: TasteBook) => book.favorite || (book.rating !== null && book.rating >= 4);

type Source = { title: string; weight: number };

/**
 * Ranks candidate Books by how well they fit the Reader's taste, with a reason for each. Taste is the
 * genres of Books the Reader finished, rated or favorited, weighted by how much they liked them and
 * by how recently. Highly rated authors earn a boost. Pure and deterministic; nothing leaves the device.
 */
export function recommend(taste: TasteBook[], candidates: Book[], options: RecommendOptions): Recommendation[] {
  const genreAffinity = new Map<string, number>();
  const genreSources = new Map<string, Source[]>();
  const authorAffinity = new Map<string, { weight: number; source: TasteBook }>();

  for (const tasteBook of taste) {
    const weight = tasteWeight(tasteBook, options.now);
    for (const key of meaningfulGenres(tasteBook.genres).keys()) {
      genreAffinity.set(key, (genreAffinity.get(key) ?? 0) + weight);
      genreSources.set(key, [...(genreSources.get(key) ?? []), { title: tasteBook.title, weight }]);
    }
    if (likedAuthorsBook(tasteBook) && weight > 0) {
      for (const author of tasteBook.authors) {
        const known = authorAffinity.get(author);
        if (!known || weight > known.weight) {
          authorAffinity.set(author, { weight, source: tasteBook });
        }
      }
    }
  }
  if (genreAffinity.size === 0 && authorAffinity.size === 0) {
    return [];
  }

  const skip = new Set([...options.excluded, ...taste.map((b) => b.isbn)]);
  const seen = new Set<string>();
  const ranked: Recommendation[] = [];

  for (const candidate of candidates) {
    if (skip.has(candidate.isbn) || seen.has(candidate.isbn)) {
      continue;
    }
    seen.add(candidate.isbn);

    const genres = meaningfulGenres(candidate.genres);
    let genrePart = 0;
    let bestGenre: { key: string; display: string; affinity: number } | null = null;
    for (const [key, display] of genres) {
      const affinity = genreAffinity.get(key) ?? 0;
      genrePart += affinity;
      if (affinity > 0 && (!bestGenre || affinity > bestGenre.affinity)) {
        bestGenre = { key, display, affinity };
      }
    }
    // Dividing by the square root keeps a Book from winning just by listing many genres.
    genrePart /= Math.sqrt(Math.max(1, genres.size));

    let authorPart = 0;
    let bestAuthor: { author: string; source: TasteBook } | null = null;
    for (const author of candidate.authors) {
      const known = authorAffinity.get(author);
      if (known && known.weight > authorPart) {
        authorPart = known.weight;
        bestAuthor = { author, source: known.source };
      }
    }

    const score = genrePart + authorPart;
    if (score <= 0) {
      continue;
    }

    const reason =
      bestAuthor && (authorPart >= genrePart || !bestGenre)
        ? authorReason(bestAuthor.author, bestAuthor.source)
        : genreReason(bestGenre!.display, genreSources.get(bestGenre!.key)!);
    ranked.push({ book: candidate, score, reason });
  }

  return ranked
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title) || a.book.isbn.localeCompare(b.book.isbn))
    .slice(0, options.limit ?? DEFAULT_LIMIT);
}

function genreReason(genre: string, sources: Source[]): string {
  const strongest = sources.reduce((best, source) => (source.weight > best.weight ? source : best));
  return `Because you liked “${strongest.title}”: ${genre}`;
}

function authorReason(author: string, source: TasteBook): string {
  const why =
    source.rating !== null && source.rating >= 4
      ? `you rated ${source.rating} stars`
      : 'you marked as a favorite';
  return `By ${author}, whose “${source.title}” ${why}`;
}

/** The Reader's taste, gathered from the device: what they finished, rated or favorited, with each Book's details. */
export async function loadTasteProfile(storage: Storage): Promise<TasteBook[]> {
  const [finishes, reviews, favoriteIsbns] = await Promise.all([
    storage.library.finishes(),
    storage.reviews.all(),
    storage.library.favoriteIsbns(),
  ]);

  const finishedAt = new Map<string, string>();
  for (const finish of finishes) {
    const known = finishedAt.get(finish.isbn);
    if (!known || finish.finishedAt > known) {
      finishedAt.set(finish.isbn, finish.finishedAt);
    }
  }
  const reviewOf = new Map(reviews.map((review) => [review.isbn, review]));
  const favorites = new Set(favoriteIsbns);

  const isbns = [...new Set([...finishedAt.keys(), ...reviewOf.keys(), ...favorites])].sort();
  const profile: TasteBook[] = [];
  for (const isbn of isbns) {
    const details = await storage.books.get(isbn);
    if (!details) {
      continue; // without its genres a Book cannot tell us anything
    }
    const review = reviewOf.get(isbn);
    profile.push({
      ...details,
      finishedAt: finishedAt.get(isbn) ?? null,
      rating: review?.rating ?? null,
      ratedAt: review?.updatedAt ?? null,
      favorite: favorites.has(isbn),
    });
  }
  return profile;
}
