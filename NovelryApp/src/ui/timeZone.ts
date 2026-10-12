/** The Reader's time zone, from the phone, so that days change at their midnight. */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
