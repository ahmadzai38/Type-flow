import type { CodeLanguage } from '../types';
import { JAVASCRIPT_SNIPPETS } from './code/javascript';
import { PYTHON_SNIPPETS } from './code/python';
import type { CodeSnippet } from './code/types';
import { TYPESCRIPT_SNIPPETS } from './code/typescript';

export type { CodeSnippet } from './code/types';

/**
 * Original, syntax-checked snippets for code mode. Every snippet in a language
 * is shown once before any of them repeats (see lib/rotation.ts).
 */
export const CODE_SNIPPETS: Record<CodeLanguage, readonly CodeSnippet[]> = {
  python: PYTHON_SNIPPETS,
  javascript: JAVASCRIPT_SNIPPETS,
  typescript: TYPESCRIPT_SNIPPETS,
};
