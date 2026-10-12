import { msUntilNextLocalDay } from './localTime';

const HOUR = 60 * 60 * 1000;

describe('msUntilNextLocalDay', () => {
  it('counts down to the next local midnight', () => {
    // 22:30 in Brussels on 11 March (21:30Z): 1.5 hours to midnight
    expect(msUntilNextLocalDay(new Date('2026-03-11T21:30:00Z'), 'Europe/Brussels')).toBe(1.5 * HOUR);
  });

  it('depends on the time zone', () => {
    const now = new Date('2026-03-11T21:30:00Z');

    expect(msUntilNextLocalDay(now, 'UTC')).toBe(2.5 * HOUR);
  });

  it('is a full day just after midnight', () => {
    // 00:00:00 in Brussels exactly
    expect(msUntilNextLocalDay(new Date('2026-03-10T23:00:00Z'), 'Europe/Brussels')).toBe(24 * HOUR);
  });

  it('is 23 hours long on the day the clocks go forward', () => {
    // Brussels, Sun 29 March 2026: midnight local is 23:00Z on the 28th; the day has 23 hours
    expect(msUntilNextLocalDay(new Date('2026-03-28T23:00:00Z'), 'Europe/Brussels')).toBe(23 * HOUR);
  });

  it('is 25 hours long on the day the clocks go back', () => {
    // Brussels, Sun 25 Oct 2026: midnight local is 22:00Z on the 24th; the day has 25 hours
    expect(msUntilNextLocalDay(new Date('2026-10-24T22:00:00Z'), 'Europe/Brussels')).toBe(25 * HOUR);
  });
});
