import { progressPercent } from './progress';

describe('progressPercent', () => {
  it('rounds the share of pages read', () => {
    expect(progressPercent(120, 545)).toBe(22);
    expect(progressPercent(545, 545)).toBe(100);
    expect(progressPercent(0, 545)).toBe(0);
  });

  it('is unknown when the Book has no page count', () => {
    expect(progressPercent(50, undefined)).toBeNull();
    expect(progressPercent(50, 0)).toBeNull();
  });

  it('only reaches 100 on the last page', () => {
    expect(progressPercent(544, 545)).toBe(99);
    expect(progressPercent(545, 545)).toBe(100);
  });

  it('never goes past 100', () => {
    expect(progressPercent(700, 545)).toBe(100);
  });
});
