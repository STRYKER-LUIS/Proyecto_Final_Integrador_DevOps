const LOCALE = 'es-CO';

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;

  // Las fechas sin hora representan días completos; se ancla al mediodía local
  // para evitar que la zona horaria las desplace al día anterior.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`);
  }

  return new Date(value);
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(toDate(value));
}

export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(toDate(value));
}

export function formatShortDate(value: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
  }).format(toDate(value));
}

export function formatRelativeTime(value: string | Date, now: Date = new Date()): string {
  const date = toDate(value);
  const diffMs = date.getTime() - now.getTime();
  const absoluteMs = Math.abs(diffMs);

  if (absoluteMs < 45_000) return 'ahora';

  const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

  if (absoluteMs < 3_600_000) {
    return relative.format(Math.round(diffMs / 60_000), 'minute');
  }

  if (absoluteMs < 86_400_000) {
    return relative.format(Math.round(diffMs / 3_600_000), 'hour');
  }

  if (absoluteMs < 7 * 86_400_000) {
    return relative.format(Math.round(diffMs / 86_400_000), 'day');
  }

  return formatDate(date);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';

  const formatted = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);

  return `${formatted} %`;
}

export function formatHours(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (value < 1) return `${Math.round(value * 60)} min`;

  const formatted = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);

  return `${formatted} h`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function truncate(text: string, maxLength: number): string {
  if (maxLength <= 0) return '';
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function formatTicketNumber(id: number): string {
  return `INC-${String(id).padStart(6, '0')}`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
