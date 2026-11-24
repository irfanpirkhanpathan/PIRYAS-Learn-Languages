import { LANGUAGES_PART_1 } from './languagesPart1';
import { LANGUAGES_PART_2 } from './languagesPart2';
import type { LanguageCourse } from '../types/piryas';

export const LANGUAGES: LanguageCourse[] = [...LANGUAGES_PART_1, ...LANGUAGES_PART_2];

export function getLanguageByCode(code: string): LanguageCourse {
  return LANGUAGES.find((lang) => lang.code === code) || LANGUAGES[0];
}
