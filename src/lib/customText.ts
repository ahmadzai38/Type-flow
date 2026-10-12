export const CUSTOM_TEXT_MAX = 5000;
export const CUSTOM_TEXT_MIN = 2;

export type CustomTextValidation =
  | { ok: true; text: string; words: number }
  | { ok: false; error: string };

const REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
  [/[\u2018\u2019\u201A\u2032]/g, "'"],
  [/[\u201C\u201D\u201E\u2033]/g, '"'],
  [/[–—\u2212]/g, '-'],
  [/\u2026/g, '...'],
  [/[\u00A0\u2007\u202F\t]/g, ' '],
  [/[\u200B-\u200D\uFEFF]/g, ''],
];

/** Converts typographic characters into ones every keyboard can type. */
export function normalizeTypography(input: string): string {
  let text = input;
  for (const [re, rep] of REPLACEMENTS) text = text.replace(re, rep);
  return text;
}

/**
 * Validates and normalizes user-provided practice text.
 * All whitespace (including line breaks) collapses to single spaces so the
 * passage flows as one paragraph; control characters are removed.
 */
export function validateCustomText(input: string): CustomTextValidation {
  if (typeof input !== 'string') return { ok: false, error: 'Text must be a string.' };
  // eslint-disable-next-line no-control-regex
  const text = normalizeTypography(input).replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
  if (text.length < CUSTOM_TEXT_MIN) {
    return { ok: false, error: 'Please enter at least a couple of characters to practice.' };
  }
  if (text.length > CUSTOM_TEXT_MAX) {
    return { ok: false, error: `Text is too long (${text.length.toLocaleString()} characters). The limit is ${CUSTOM_TEXT_MAX.toLocaleString()}.` };
  }
  return { ok: true, text, words: text.split(' ').length };
}
