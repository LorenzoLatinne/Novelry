function isbn13CheckDigit(first12: string): number {
  const sum = [...first12].reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

function isValidIsbn10(isbn10: string): boolean {
  const sum = [...isbn10].reduce(
    (total, char, index) => total + (10 - index) * (char === 'X' ? 10 : Number(char)),
    0,
  );
  return sum % 11 === 0;
}

/**
 * Turns what a Reader typed or a barcode scanner read into a canonical ISBN-13,
 * or null when it is not a valid ISBN (wrong length, wrong check digit, or an
 * EAN that is not a book).
 */
export function parseIsbn(input: string): string | null {
  const cleaned = input.replace(/[\s-]/g, '').toUpperCase();

  if (/^97[89]\d{10}$/.test(cleaned)) {
    return isbn13CheckDigit(cleaned.slice(0, 12)) === Number(cleaned[12]) ? cleaned : null;
  }

  if (/^\d{9}[\dX]$/.test(cleaned) && isValidIsbn10(cleaned)) {
    const first12 = `978${cleaned.slice(0, 9)}`;
    return `${first12}${isbn13CheckDigit(first12)}`;
  }

  return null;
}
