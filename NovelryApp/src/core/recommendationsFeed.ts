import type { Book } from './catalog/book';
import type { BookCatalog } from './catalog/openLibraryCatalog';
import {
  loadExcludedIsbns,
  loadTasteProfile,
  recommend,
  topGenres,
  type Recommendation,
} from './recommendations';
import type { Storage } from './storage/storage';

/** How many of the Reader's best-liked genres to look for more Books in. */
const GENRES_TO_EXPLORE = 3;

export type RecommendationsResult =
  /** The Reader has not finished, rated or favorited anything yet, so there is nothing to go on. */
  | { status: 'no-taste' }
  /** There was taste to go on, but nothing found fits (or everything fitting was already seen). */
  | { status: 'none' }
  | { status: 'ok'; recommendations: Recommendation[] };

/**
 * Finds Books in the genres the Reader likes best and ranks them for them, leaving out everything in their
 * Library and everything they dismissed. Works from a small Library; says so when there is nothing to go on.
 * Throws if Open Library cannot be reached at all; if only some lookups fail, the rest are used.
 */
export async function loadRecommendations(
  deps: { storage: Storage; catalog: BookCatalog },
  now: Date,
): Promise<RecommendationsResult> {
  const taste = await loadTasteProfile(deps.storage);
  const genres = topGenres(taste, now, GENRES_TO_EXPLORE);
  if (taste.length === 0 || genres.length === 0) {
    return { status: 'no-taste' };
  }

  const lookups = await Promise.allSettled(genres.map((genre) => deps.catalog.searchBySubject(genre)));
  const answered = lookups.filter(
    (lookup): lookup is PromiseFulfilledResult<{ books: Book[]; total: number }> => lookup.status === 'fulfilled',
  );
  if (answered.length === 0) {
    const failure = lookups.find((lookup): lookup is PromiseRejectedResult => lookup.status === 'rejected');
    throw failure?.reason;
  }

  const [inLibrary, dismissed] = await Promise.all([loadExcludedIsbns(deps.storage), deps.storage.dismissals.all()]);
  const recommendations = recommend(taste, answered.flatMap((lookup) => lookup.value.books), {
    now,
    excluded: new Set([...inLibrary, ...dismissed]),
  });
  return recommendations.length === 0 ? { status: 'none' } : { status: 'ok', recommendations };
}
