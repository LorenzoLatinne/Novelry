/** Calendar helpers that follow the Reader's time zone, so days and years change at their midnight. */

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

export function localParts(instant: number, timeZone: string) {
  const parts = formatterFor(timeZone).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24, // some engines report midnight as 24
    minute: get('minute'),
    second: get('second'),
  };
}

/** How far the time zone is ahead of UTC at an instant, in milliseconds. */
function offsetAt(instant: number, timeZone: string): number {
  const p = localParts(instant - (instant % 1000), timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - (instant - (instant % 1000));
}

/** The instant at which a calendar day begins in a time zone. Months are 1-12; days may overflow. */
export function startOfLocalDay(year: number, month: number, day: number, timeZone: string): number {
  const asIfUtc = Date.UTC(year, month - 1, day);
  const first = asIfUtc - offsetAt(asIfUtc, timeZone);
  return asIfUtc - offsetAt(first, timeZone);
}

/** Milliseconds from `now` until the Reader's next midnight, when the day (and maybe the year) changes. */
export function msUntilNextLocalDay(now: Date, timeZone: string): number {
  const { year, month, day } = localParts(now.getTime(), timeZone);
  return startOfLocalDay(year, month, day + 1, timeZone) - now.getTime();
}
