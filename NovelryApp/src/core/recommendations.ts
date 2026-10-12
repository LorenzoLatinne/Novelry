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
  /** Books never to recommend: in the Library, or dismissed by the Reader. */
  excluded: Set<string>;
  /** At most this many recommendations. */
  limit?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** Reading from this many days ago counts half as much as reading today. */
const HALF_LIFE_DAYS = 180;
/** A Rating at or above this makes the author worth a boost; at or below DISLIKED the Book counts against its genres. */
const HIGH_RATING = 4;
const DISLIKED_RATING = 2;
/** The author boost is this share of how much the Reader liked the Book: a nudge, not a match on its own weight. */
const AUTHOR_BOOST = 0.5;
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

const normalize = (text: string) => text.trim().toLowerCase();

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

/**
 * How much a Book says about the Reader's taste: positive if liked, negative if disliked, fading with time.
 * A low Rating outweighs having finished the Book, so a Book finished and rated poorly counts against its genres.
 */
function tasteWeight(book: TasteBook, now: Date): number {
  const disliked = book.rating !== null && book.rating <= DISLIKED_RATING;
  const finishedAndRated = (book.finishedAt ? 1 : 0) + (book.rating === null ? 0 : (book.rating - 3) / 2);
  const base = (disliked ? book.rating! - 3 : finishedAndRated) + (book.favorite ? 1 : 0);
  const dates = [book.finishedAt, book.ratedAt].filter((d): d is string => d !== null).map(Date.parse);
  if (dates.length === 0) {
    return base;
  }
  const ageDays = Math.max(0, (now.getTime() - Math.max(...dates)) / DAY_MS);
  return base * 0.5 ** (ageDays / HALF_LIFE_DAYS);
}

/** Whether the Reader clearly liked a Book, which makes its author worth a boost. */
const showsStrongLike = (book: TasteBook) => book.favorite || (book.rating !== null && book.rating >= HIGH_RATING);

type Source = { book: TasteBook; weight: number };
type Affinities = {
  genre: Map<string, number>;
  genreSources: Map<string, Source[]>;
  author: Map<string, Source & { name: string }>;
};

/** What the Reader's Books say about which genres and authors they like. */
function buildAffinities(taste: TasteBook[], now: Date): Affinities {
  const genre = new Map<string, number>();
  const genreSources = new Map<string, Source[]>();
  const author = new Map<string, Source & { name: string }>();

  for (const book of taste) {
    const weight = tasteWeight(book, now);
    for (const key of meaningfulGenres(book.genres).keys()) {
      genre.set(key, (genre.get(key) ?? 0) + weight);
      genreSources.set(key, [...(genreSources.get(key) ?? []), { book, weight }]);
    }
    if (showsStrongLike(book) && weight > 0) {
      for (const name of book.authors) {
        const known = author.get(normalize(name));
        if (!known || weight > known.weight) {
          author.set(normalize(name), { book, weight, name: name.trim() });
        }
      }
    }
  }
  return { genre, genreSources, author };
}

/** How well one candidate fits, and why. Null when it does not fit at all. */
function scoreCandidate(candidate: Book, affinities: Affinities): Omit<Recommendation, 'book'> | null {
  const genres = meaningfulGenres(candidate.genres);
  let genrePart = 0;
  let bestGenre: { key: string; display: string; affinity: number } | null = null;
  for (const [key, display] of genres) {
    const affinity = affinities.genre.get(key) ?? 0;
    genrePart += affinity;
    if (affinity > 0 && (!bestGenre || affinity > bestGenre.affinity)) {
      bestGenre = { key, display, affinity };
    }
  }
  // Dividing by the square root keeps a Book from winning just by listing many genres.
  genrePart /= Math.sqrt(Math.max(1, genres.size));

  let authorPart = 0;
  let bestAuthor: (Source & { name: string }) | null = null;
  for (const name of candidate.authors) {
    const known = affinities.author.get(normalize(name));
    if (known && known.weight * AUTHOR_BOOST > authorPart) {
      authorPart = known.weight * AUTHOR_BOOST;
      bestAuthor = known;
    }
  }

  const score = genrePart + authorPart;
  if (score <= 0) {
    return null;
  }
  if (bestAuthor && (authorPart >= genrePart || !bestGenre)) {
    return { score, reason: authorReason(bestAuthor.name, bestAuthor.book) };
  }
  if (bestGenre) {
    return { score, reason: genreReason(bestGenre.display, affinities.genreSources.get(bestGenre.key)!) };
  }
  return null;
}

/**
 * Ranks candidate Books by how well they fit the Reader's taste, with a reason for each. Taste is the
 * genres of Books the Reader finished, rated or favorited, weighted by how much they liked them and
 * by how recently. Highly rated authors earn a small boost. Pure and deterministic; nothing leaves the device.
 */
export function recommend(taste: TasteBook[], candidates: Book[], options: RecommendOptions): Recommendation[] {
  const affinities = buildAffinities(taste, options.now);
  if (affinities.genre.size === 0 && affinities.author.size === 0) {
    return [];
  }

  const skip = new Set([...options.excluded, ...taste.map((b) => b.isbn)]);
  const considered = new Set<string>();
  const ranked: Recommendation[] = [];
  for (const candidate of candidates) {
    if (skip.has(candidate.isbn) || considered.has(candidate.isbn)) {
      continue;
    }
    considered.add(candidate.isbn);
    const fit = scoreCandidate(candidate, affinities);
    if (fit) {
      ranked.push({ book: candidate, ...fit });
    }
  }

  return ranked
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.book.title.localeCompare(b.book.title, 'en') ||
        a.book.isbn.localeCompare(b.book.isbn, 'en'),
    )
    .slice(0, Math.max(0, options.limit ?? DEFAULT_LIMIT));
}

/** Says only what the Reader actually did with the Book that points to this genre. */
function genreReason(genre: string, sources: Source[]): string {
  const { book } = sources.reduce((best, source) => (source.weight > best.weight ? source : best));
  if (book.favorite) {
    return `Because “${book.title}” is one of your favorites · ${genre}`;
  }
  if (book.rating !== null) {
    return `Because you rated “${book.title}” ${book.rating} stars · ${genre}`;
  }
  return `Because you finished “${book.title}” · ${genre}`;
}

function authorReason(author: string, book: TasteBook): string {
  const why =
    book.rating !== null && book.rating >= HIGH_RATING
      ? `you rated ${book.rating} stars`
      : 'you marked as a favorite';
  return `By ${author}, whose “${book.title}” ${why}`;
}

/** Everything already in the Library: never recommended, even a Book the Reader has only added so far. */
export async function loadExcludedIsbns(storage: Storage): Promise<Set<string>> {
  return new Set((await storage.library.list()).map((entry) => entry.isbn));
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
  const details = await Promise.all(isbns.map((isbn) => storage.books.get(isbn)));
  return details.flatMap((book) => {
    if (!book) {
      return []; // without its genres a Book cannot tell us anything
    }
    const review = reviewOf.get(book.isbn);
    return [
      {
        ...book,
        finishedAt: finishedAt.get(book.isbn) ?? null,
        rating: review?.rating ?? null,
        ratedAt: review?.updatedAt ?? null,
        favorite: favorites.has(book.isbn),
      },
    ];
  });
}
