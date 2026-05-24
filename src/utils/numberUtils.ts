/**
 * Parse robuste d'une valeur numérique saisie par l'utilisateur.
 * Gère : "5 000", "5,000", "5.000", 5000, undefined, null.
 */
export function cleanNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}
