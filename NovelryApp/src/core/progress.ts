/** How far through a Book the Reader is, as a whole percentage, or null when the Book's length is unknown. */
export function progressPercent(currentPage: number, pageCount: number | undefined): number | null {
  if (!pageCount) {
    return null;
  }
  return Math.min(100, Math.round((currentPage / pageCount) * 100));
}
