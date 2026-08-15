export function formatTicketCode(
  ticketNumber?: number | null,
  fallbackId?: string
): string {
  if (ticketNumber) {
    return `TICK-${ticketNumber}`;
  }
  if (fallbackId) {
    return `TICK-${fallbackId.slice(0, 8).toUpperCase()}`;
  }
  return 'TICK-NEW';
}
