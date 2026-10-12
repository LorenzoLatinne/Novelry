import type { Book } from './catalog/book';
import { loadTasteProfile, recommend, type TasteBook } from './recommendations';
import { openStorage } from './storage/storage';
import { createTestDatabase } from './storage/testDatabase';

const NOW = new Date('2026-06-01T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString();

let n = 0;
const book = (title: string, authors: string[], genres: string[]): Book => ({
  isbn: `97800000${String(n++).padStart(5, '0')}`,
  title,
  authors,
  genres,
});
const liked = (b: Book, extra: Partial<TasteBook> = {}): TasteBook => ({
  ...b,
  finishedAt: daysAgo(1),
  rating: null,
  ratedAt: null,
  favorite: false,
  ...extra,
});
const options = { now: NOW, excluded: new Set<string>() };

const dune = book('Dune', ['Frank Herbert'], ['Science Fiction', 'Desert']);
const foundation = book('Foundation', ['Isaac Asimov'], ['Science Fiction', 'Empire']);
const emma = book('Emma', ['Jane Austen'], ['Romance', 'Society']);
const neuromancer = book('Neuromancer', ['William Gibson'], ['Science Fiction', 'Cyberpunk']);

describe('recommend', () => {
  it('recommends nothing when the Reader has no taste to go on yet', () => {
    expect(recommend([], [foundation, emma], options)).toEqual([]);
  });

  it('recommends Books from genres the Reader finished, and leaves out unrelated ones', () => {
    const result = recommend([liked(dune)], [emma, foundation], options);

    expect(result.map((r) => r.book.title)).toEqual(['Foundation']);
  });

  it('weighs Ratings: a loved genre ranks above a merely finished one', () => {
    const taste = [
      liked(dune, { rating: 5, ratedAt: daysAgo(1) }),
      liked(emma, { rating: 3, ratedAt: daysAgo(1) }),
    ];
    const romance = book('Persuasion', ['Jane Austen'], ['Romance', 'Navy']);

    const result = recommend(taste, [romance, foundation], options);

    expect(result.map((r) => r.book.title)).toEqual(['Foundation', 'Persuasion']);
  });

  it('counts a Favorite as a reason to like a genre', () => {
    const taste = [liked(dune, { finishedAt: null, favorite: true })];

    expect(recommend(taste, [foundation], options).map((r) => r.book.title)).toEqual(['Foundation']);
  });

  it('does not recommend from a genre the Reader rated poorly', () => {
    const taste = [liked(emma, { rating: 1, ratedAt: daysAgo(1) }), liked(dune, { rating: 5, ratedAt: daysAgo(1) })];
    const romance = book('Persuasion', ['Jane Austen'], ['Romance', 'Navy']);

    const result = recommend(taste, [romance, foundation], options);

    expect(result.map((r) => r.book.title)).toEqual(['Foundation']);
  });

  it('counts recent reading more: a Book read 180 days ago counts half as much as one read today', () => {
    const recent = liked(dune, { finishedAt: daysAgo(0) });
    const old = liked(emma, { finishedAt: daysAgo(180) });
    const scifi = book('Hyperion', ['Dan Simmons'], ['Science Fiction']);
    const romance = book('Persuasion', ['Jane Austen'], ['Romance']);

    const result = recommend([recent, old], [scifi, romance], options);
    const score = (title: string) => result.find((r) => r.book.title === title)!.score;

    expect(result.map((r) => r.book.title)).toEqual(['Hyperion', 'Persuasion']);
    expect(score('Hyperion') / score('Persuasion')).toBeCloseTo(2, 5);
  });

  it('never recommends a Book already in the Library, or one the Reader dismissed', () => {
    const inLibrary = book('Hyperion', ['Dan Simmons'], ['Science Fiction']);
    const dismissed = book('Neuromancer', ['William Gibson'], ['Science Fiction']);

    const result = recommend([liked(dune)], [inLibrary, dismissed, foundation], {
      ...options,
      excluded: new Set([inLibrary.isbn, dismissed.isbn, dune.isbn]),
    });

    expect(result.map((r) => r.book.title)).toEqual(['Foundation']);
  });

  it('boosts Books by an author the Reader rated highly, even in other genres', () => {
    const taste = [liked(dune, { rating: 5, ratedAt: daysAgo(1) })];
    const byAuthor = book('Dune Messiah', ['Frank Herbert'], ['Politics']);

    const result = recommend(taste, [byAuthor, emma], options);

    expect(result.map((r) => r.book.title)).toEqual(['Dune Messiah']);
    expect(result[0].reason).toBe('By Frank Herbert, whose “Dune” you rated 5 stars');
  });

  it('does not boost an author the Reader rated poorly', () => {
    const taste = [liked(dune, { rating: 2, ratedAt: daysAgo(1) })];
    const byAuthor = book('Dune Messiah', ['Frank Herbert'], ['Politics']);

    expect(recommend(taste, [byAuthor], options)).toEqual([]);
  });

  it('explains each recommendation with the Book and genre behind it', () => {
    const taste = [liked(dune, { rating: 5, ratedAt: daysAgo(1) }), liked(emma)];

    const [first] = recommend(taste, [foundation], options);

    expect(first.reason).toBe('Because you liked “Dune”: Science Fiction');
  });

  it('names the strongest source Book when several point to the same genre', () => {
    const taste = [
      liked(dune, { rating: 3, ratedAt: daysAgo(1) }),
      liked(neuromancer, { rating: 5, ratedAt: daysAgo(1) }),
    ];

    const [first] = recommend(taste, [foundation], options);

    expect(first.reason).toBe('Because you liked “Neuromancer”: Science Fiction');
  });

  it('ignores catch-all subjects such as "Fiction", which say nothing about taste', () => {
    const generic = liked(book('Novel A', ['A. Writer'], ['Fiction', 'Accessible book']));
    const other = book('Novel B', ['B. Writer'], ['Fiction', 'Accessible book']);

    expect(recommend([generic], [other], options)).toEqual([]);
  });

  it('matches genres regardless of case and spacing', () => {
    const taste = [liked(book('A', [], ['  science fiction ']))];
    const candidate = book('B', [], ['Science Fiction']);

    expect(recommend(taste, [candidate], options)).toHaveLength(1);
  });

  it('does not let a Book with many genres win just for having many', () => {
    const taste = [liked(dune)];
    const focused = book('Hyperion', ['Dan Simmons'], ['Science Fiction']);
    const sprawling = book('Everything', ['X'], ['Science Fiction', 'A', 'B', 'C', 'D']);

    const result = recommend(taste, [sprawling, focused], options);

    expect(result.map((r) => r.book.title)).toEqual(['Hyperion', 'Everything']);
  });

  it('gives the same order every time, breaking ties by title', () => {
    const taste = [liked(dune)];
    const a = book('Alpha', ['A'], ['Science Fiction']);
    const b = book('Beta', ['B'], ['Science Fiction']);

    const first = recommend(taste, [b, a], options);
    const second = recommend(taste, [a, b], options);

    expect(first.map((r) => r.book.title)).toEqual(['Alpha', 'Beta']);
    expect(second).toEqual(first);
  });

  it('stops at the requested number of recommendations', () => {
    const candidates = ['One', 'Two', 'Three', 'Four'].map((title) => book(title, [], ['Science Fiction']));

    expect(recommend([liked(dune)], candidates, { ...options, limit: 2 })).toHaveLength(2);
  });

  it('lists a candidate once, even if it was offered twice', () => {
    const hyperion = book('Hyperion', [], ['Science Fiction']);

    expect(recommend([liked(dune)], [hyperion, { ...hyperion }], options)).toHaveLength(1);
  });
});

describe('loadTasteProfile', () => {
  it('gathers finished Books, Ratings, Favorites and the details of each from the device', async () => {
    const storage = await openStorage(createTestDatabase());
    await storage.library.add(dune);
    await storage.library.add(emma);
    await storage.library.add(foundation);
    await storage.library.moveToShelf(dune.isbn, 'read', new Date(daysAgo(10)));
    await storage.reviews.save(dune.isbn, { rating: 5, comment: '' }, new Date(daysAgo(9)));
    await storage.reviews.save(emma.isbn, { rating: 4, comment: '' }, new Date(daysAgo(3)));
    await storage.library.setFavorite(foundation.isbn, true);

    const profile = await loadTasteProfile(storage);
    const byTitle = (title: string) => profile.find((p) => p.title === title)!;

    expect(profile.map((p) => p.title).sort()).toEqual(['Dune', 'Emma', 'Foundation']);
    expect(byTitle('Dune')).toMatchObject({ rating: 5, favorite: false, finishedAt: daysAgo(10), genres: ['Science Fiction', 'Desert'] });
    expect(byTitle('Emma')).toMatchObject({ rating: 4, finishedAt: null });
    expect(byTitle('Foundation')).toMatchObject({ favorite: true, rating: null });
  });

  it('keeps what a Reader finished or rated after the Book left the Library (ADR-0004)', async () => {
    const storage = await openStorage(createTestDatabase());
    await storage.library.add(dune);
    await storage.library.moveToShelf(dune.isbn, 'read', new Date(daysAgo(10)));
    await storage.reviews.save(dune.isbn, { rating: 5, comment: '' }, new Date(daysAgo(9)));
    await storage.library.remove(dune.isbn);

    const profile = await loadTasteProfile(storage);

    expect(profile).toHaveLength(1);
    expect(profile[0]).toMatchObject({ title: 'Dune', rating: 5 });
  });

  it('has nothing for a Reader who has not finished, rated or favorited anything', async () => {
    const storage = await openStorage(createTestDatabase());
    await storage.library.add(dune);

    expect(await loadTasteProfile(storage)).toEqual([]);
  });
});
