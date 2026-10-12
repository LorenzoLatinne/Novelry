/** How far through a Book the Reader is, as a whole percentage (100 only on the last page), or null when the Book's length is unknown. */
export function progressPercent(currentPage: number, pageCount: number | undefined): number | null {
  if (!pageCount) {
    return null;
  }
  if (currentPage >= pageCount) {
    return 100;
  }
  return Math.min(99, Math.round((currentPage / pageCount) * 100));
}
