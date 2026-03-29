/**
 * Format a date string or Date object to a readable Vietnamese format
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (e.g., "15/03/2026")
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format a date string to a detailed Vietnamese format
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (e.g., "15 Tháng 3, 2026")
 */
export function formatDateDetailed(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  return `${day} ${monthNames[month - 1]}, ${year}`;
}

/**
 * Calculate the number of days between two dates
 * @param startDate - Start date string or Date object
 * @param endDate - End date string or Date object
 * @returns Number of days (can be negative if endDate is before startDate)
 */
export function daysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if a date is in the past
 * @param dateString - Date string or Date object to check
 * @returns True if the date is in the past
 */
export function isPast(dateString: string | Date): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.getTime() < Date.now();
}

/**
 * Check if a date is in the future
 * @param dateString - Date string or Date object to check
 * @returns True if the date is in the future
 */
export function isFuture(dateString: string | Date): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.getTime() > Date.now();
}

/**
 * Add days to a date
 * @param dateString - Base date string or Date object
 * @param days - Number of days to add (can be negative)
 * @returns New date with days added
 */
export function addDays(dateString: string | Date, days: number): Date {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 * @param dateString - Base date string or Date object
 * @param months - Number of months to add (can be negative)
 * @returns New date with months added
 */
export function addMonths(dateString: string | Date, months: number): Date {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Check if a date is within N days from now
 * @param dateString - Date string or Date object to check
 * @param days - Number of days threshold
 * @returns True if date is within the threshold
 */
export function isWithinDays(dateString: string | Date, days: number): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

/**
 * Check if a date is before today
 * @param dateString - Date string or Date object to check
 * @returns True if date is in the past
 */
export function isBeforeToday(dateString: string | Date): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
