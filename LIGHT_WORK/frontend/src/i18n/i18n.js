import en from "./en.json";
import ur from "./ur.json";

export const DICTS = { en, ur };

export function t(lang, key) {
  return DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
}
