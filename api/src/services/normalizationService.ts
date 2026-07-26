/**
 * Deterministic normalization utilities.
 * Rules:
 * - Case differences: allowed (normalize to lowercase for comparison)
 * - Extra spaces: stripped
 * - Initials: NOT expanded — "S.P. Patil" ≠ "Sanjay Patil" (distinct evidence)
 * - Dates: normalized to YYYY-MM-DD where possible; year-only stays as YYYY
 * - Do NOT use fuzzy matching to accept different values
 */

// ─── Name Normalizer ─────────────────────────────────────────────
export function normalizeName(value: string): string {
  return value
    .normalize('NFC')           // Unicode normalization
    .toLowerCase()
    .replace(/\s+/g, ' ')       // Collapse extra spaces
    .replace(/\./g, '')         // Remove periods (S.P. → SP, but won't expand)
    .trim();
}

// ─── DOB Normalizer ──────────────────────────────────────────────
// Returns { normalized: string, isIncomplete: boolean }
// isIncomplete = true when only year is present
export function normalizeDob(value: string): { normalized: string; isIncomplete: boolean } {
  if (!value) return { normalized: '', isIncomplete: false };

  const v = value.trim();

  // Year-only: e.g. "2004", "2004.", "DOB: 2004"
  const yearOnlyMatch = v.match(/^(?:DOB\s*:\s*)?(\d{4})\.?$/i);
  if (yearOnlyMatch) {
    return { normalized: yearOnlyMatch[1], isIncomplete: true };
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = v.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    return { normalized: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`, isIncomplete: false };
  }

  // MM/DD/YYYY (US format — less likely but handle)
  // We disambiguate: if DD > 12 it must be day-first, otherwise treat as DD/MM/YYYY
  // Already handled above

  // YYYY-MM-DD (ISO)
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return { normalized: v, isIncomplete: false };
  }

  // DD-Mon-YYYY (e.g. 12-May-2004)
  const months: Record<string, string> = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
  };
  const ddMonYyyy = v.match(/^(\d{1,2})[-\s]([a-z]{3})[-\s](\d{4})$/i);
  if (ddMonYyyy) {
    const [, d, mon, y] = ddMonYyyy;
    const m = months[mon.toLowerCase()];
    if (m) return { normalized: `${y}-${m}-${d.padStart(2, '0')}`, isIncomplete: false };
  }

  // MM-YYYY (year + month only)
  const mmyyyy = v.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (mmyyyy) {
    const [, m, y] = mmyyyy;
    return { normalized: `${y}-${m.padStart(2, '0')}`, isIncomplete: true };
  }

  // Fallback: return as-is (lowercased), mark incomplete if short
  return { normalized: v.toLowerCase(), isIncomplete: v.length <= 4 };
}

// ─── Gender Normalizer ───────────────────────────────────────────
export function normalizeGender(value: string): string {
  const v = value.trim().toLowerCase();
  if (['male', 'm', 'पुरुष', 'पु.'].includes(v)) return 'male';
  if (['female', 'f', 'महिला', 'स्त्री'].includes(v)) return 'female';
  if (['other', 'transgender', 'third gender', 'others', 'o', 'x'].includes(v)) return 'other';
  return v;
}

// ─── ID Number Normalizer ────────────────────────────────────────
export function normalizeIdNumber(value: string): string {
  return value
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Address Normalizer ──────────────────────────────────────────
export function normalizeAddress(value: string): string {
  return value
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Generic Normalizer ──────────────────────────────────────────
const canonicalAliases: Record<string, string> = {
  name: 'full_name', child_name: 'full_name', candidate_name: 'full_name', student_name: 'full_name',
  dob: 'date_of_birth', birth_date: 'date_of_birth', year_of_birth: 'date_of_birth', sex: 'gender',
  aadhaar_no: 'aadhaar_number', pan_no: 'pan_number', reg_no: 'registration_number',
  roll_no: 'seat_number', institution: 'school_name', exam_year: 'examination_year',
};

export function canonicalFieldKey(fieldKey: string): string {
  return canonicalAliases[fieldKey] || fieldKey;
}

export function normalizeField(fieldKey: string, value: string): { normalized: string; incomplete?: boolean } {
  if (!value) return { normalized: '' };
  fieldKey = canonicalFieldKey(fieldKey);

  if (['full_name', 'father_name', 'mother_name', 'parent_name'].includes(fieldKey)) {
    return { normalized: normalizeName(value) };
  }

  if (fieldKey === 'date_of_birth') {
    const { normalized, isIncomplete } = normalizeDob(value);
    return { normalized, incomplete: isIncomplete };
  }

  if (['validity_date', 'expiry_date'].includes(fieldKey)) {
    const { normalized } = normalizeDob(value);
    return { normalized };
  }

  if (fieldKey === 'gender') {
    return { normalized: normalizeGender(value) };
  }

  if (['aadhaar_number', 'pan_number', 'registration_number', 'seat_number'].includes(fieldKey)) {
    return { normalized: normalizeIdNumber(value) };
  }

  if (['address', 'permanent_address', 'residential_address'].includes(fieldKey)) {
    return { normalized: normalizeAddress(value) };
  }

  if (['institution', 'place_of_birth', 'place_of_issue', 'nationality'].includes(fieldKey)) {
    return { normalized: value.trim().toLowerCase().replace(/\s+/g, ' ') };
  }

  // Default
  return { normalized: value.trim().toLowerCase() };
}
