/** A whole percentage of a target. It only reads 100 once the target is met, never from rounding. */
export function percentOf(done: number, target: number): number {
  if (done >= target) {
    return 100;
  }
  return Math.min(99, Math.round((done / target) * 100));
}
