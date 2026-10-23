/**
 * Robust string normalization and similarity utilities for student records
 */

export function cleanString(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Normalizes student name:
 * - lowercase
 * - replaces tabs, newlines, and multiple spaces with a single space
 * - removes dots and punctuation (e.g. "A.B. Perera" -> "ab perera")
 */
export function normalizeName(name: any): string {
  if (!name) return '';
  let str = String(name).toLowerCase().trim();
  // Replace punctuation like dots, commas, hyphens with space
  str = str.replace(/[.,\-_/\\#()]/g, ' ');
  // Collapse whitespace
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}

/**
 * Normalizes student registration or index number:
 * - uppercase
 * - strips internal spaces and hyphens for flexible exact comparison
 */
export function normalizeStudentNumber(val: any): string {
  if (!val) return '';
  const str = String(val).trim().toUpperCase();
  // We keep alphanumeric chars
  return str.replace(/[^A-Z0-9]/g, '');
}

/**
 * Normalizes National Identity Card (NIC) number:
 * - uppercase
 * - strips spaces and hyphens
 * Handles 9-digit + V/X (old) and 12-digit (new)
 */
export function normalizeNIC(val: any): string {
  if (!val) return '';
  const str = String(val).trim().toUpperCase().replace(/[\s\-_]/g, '');
  return str;
}

/**
 * Compares two NICs, accounting for old (9 digits + V/X) vs new (12 digits) formats if applicable.
 */
export function areNICsMatching(nic1: any, nic2: any): boolean {
  const n1 = normalizeNIC(nic1);
  const n2 = normalizeNIC(nic2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;

  // Sri Lankan NIC conversion rule check:
  // Old format: YY DDD SSS V (9 digits + V)
  // New format: 19YY 0DDD SSS 0 (12 digits)
  // If either has format conversion match:
  if (n1.length === 10 && (n1.endsWith('V') || n1.endsWith('X')) && n2.length === 12) {
    const yearOld = n1.substring(0, 2);
    const dayOld = n1.substring(2, 5);
    const serialOld = n1.substring(5, 9);
    // Compare against 19YY0DDD...
    const yearNew = n2.substring(0, 4);
    const dayNew = n2.substring(4, 8);
    const serialNew = n2.substring(8, 11);
    if ((yearNew === `19${yearOld}` || yearNew === `20${yearOld}`) &&
        dayNew === `0${dayOld}` &&
        serialNew === serialOld.substring(0, 3)) {
      return true;
    }
  }

  if (n2.length === 10 && (n2.endsWith('V') || n2.endsWith('X')) && n1.length === 12) {
    return areNICsMatching(n2, n1);
  }

  return false;
}

/**
 * Normalizes email address:
 * - lowercase, trimmed
 */
export function normalizeEmail(val: any): string {
  if (!val) return '';
  return String(val).trim().toLowerCase();
}

/**
 * Normalizes mobile number:
 * - strips all non-digits
 * - strips leading country codes (+94, 94, 0, etc.) for standardized comparison
 */
export function normalizeMobile(val: any): string {
  if (!val) return '';
  let str = String(val).trim().replace(/\D/g, '');
  if (!str) return '';

  // Remove leading country code if 11 or 12 digits (e.g., 94771234567 -> 771234567)
  if (str.startsWith('94') && str.length === 11) {
    str = str.substring(2);
  } else if (str.startsWith('0') && str.length === 10) {
    str = str.substring(1);
  }

  return str;
}

/**
 * Calculates Levenshtein Distance
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = [];
  for (let i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Levenshtein-based similarity ratio (0.0 to 1.0)
 */
export function levenshteinSimilarity(a: string, b: string): number {
  if (!a && !b) return 1.0;
  if (!a || !b) return 0.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / maxLen;
}

/**
 * Token sort similarity:
 * Handles swapped words (e.g. "John Doe" vs "Doe John")
 */
export function tokenSortSimilarity(a: string, b: string): number {
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const tokensA = normA.split(' ').filter(Boolean).sort().join(' ');
  const tokensB = normB.split(' ').filter(Boolean).sort().join(' ');

  if (tokensA === tokensB) return 1.0;

  // Return highest between standard similarity and sorted token similarity
  const rawSim = levenshteinSimilarity(normA, normB);
  const sortedSim = levenshteinSimilarity(tokensA, tokensB);

  // Also check if one is an exact substring of the other (e.g. "Amal Silva" inside "Amal Silva Perera")
  let tokenOverlapScore = 0;
  const setA = new Set(normA.split(' ').filter(Boolean));
  const setB = new Set(normB.split(' ').filter(Boolean));
  let intersectionCount = 0;
  for (const t of setA) {
    if (setB.has(t)) intersectionCount++;
  }
  if (setA.size > 0 && setB.size > 0) {
    tokenOverlapScore = (2 * intersectionCount) / (setA.size + setB.size);
  }

  return Math.max(rawSim, sortedSim, tokenOverlapScore * 0.9);
}
