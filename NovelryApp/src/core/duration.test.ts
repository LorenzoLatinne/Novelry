import { formatDuration } from './duration';

describe('formatDuration', () => {
  it('shows minutes and seconds under an hour', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(754)).toBe('12:34');
  });

  it('adds hours from one hour on', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3723)).toBe('1:02:03');
  });

  it('never shows a negative or fractional time', () => {
    expect(formatDuration(-5)).toBe('0:00');
    expect(formatDuration(59.9)).toBe('0:59');
  });
});
