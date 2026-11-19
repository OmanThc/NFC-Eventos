/**
 * Formats numbers into USD string: e.g. "$25.00"
 */
export function formatUSD(value: number): string {
  const safeVal = Number.isFinite(value) ? value : 0;
  return '$' + safeVal.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats numbers into Venezuelan Bolívares string: e.g. "Bs. 1.310,00"
 */
export function formatBs(value: number): string {
  const safeVal = Number.isFinite(value) ? value : 0;
  return 'Bs. ' + safeVal.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats short time: e.g. "14:35"
 */
export function formatTime(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats full date: e.g. "18 nov 2026, 02:35 p.m."
 */
export function formatDateTime(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  return date.toLocaleString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
