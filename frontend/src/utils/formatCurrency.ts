/**
 * Formats a number into Indian Rupee string natively using Intl.NumberFormat.
 * Converts to Crores (Cr) or Lakhs (Lakh) for large numbers to keep UI clean.
 */
export const formatIndianCurrency = (value: number, autoScale: boolean = true): string => {
  if (!value) return '\u20b90';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (autoScale) {
    if (absValue >= 10000000) {
      return `${sign}\u20b9${(absValue / 10000000).toFixed(2)} Cr`;
    }

    if (absValue >= 100000) {
      return `${sign}\u20b9${(absValue / 100000).toFixed(2)} Lakh`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};
