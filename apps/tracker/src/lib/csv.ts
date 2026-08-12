/**
 * Escapes a single CSV cell: quotes values containing commas/quotes/newlines,
 * and neutralizes leading =, +, -, @ characters that Excel/Sheets would
 * otherwise interpret as the start of a formula (a well-known CSV export
 * vulnerability class — formula injection).
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';

  let str = String(value);
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  return lines.join('\n');
}
