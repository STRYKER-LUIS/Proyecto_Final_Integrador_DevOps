export function formatTicketNumber(id: number): string {
  return `INC-${String(id).padStart(6, '0')}`;
}
