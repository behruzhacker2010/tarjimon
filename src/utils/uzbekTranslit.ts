/**
 * Uzbek Latin <-> Cyrillic fast offline transliteration utility
 * Complies with official Uzbek orthography rules
 */

type Replacer = string | ((match: string, ...args: string[]) => string);

const LATIN_TO_CYRILLIC_PAIRS: [RegExp, Replacer][] = [
  // Compound letters with apostrophes (handling all variants: ʻ, ', ‘, ’, `)
  [/O[ʻ'‘ʼ`]/g, 'Ў'],
  [/o[ʻ'‘ʼ`]/g, 'ў'],
  [/G[ʻ'‘ʼ`]/g, 'Ғ'],
  [/g[ʻ'‘ʼ`]/g, 'ғ'],
  [/SH/g, 'Ш'],
  [/Sh/g, 'Ш'],
  [/sh/g, 'ш'],
  [/CH/g, 'Ч'],
  [/Ch/g, 'Ч'],
  [/ch/g, 'ч'],
  [/YO/g, 'Ё'],
  [/Yo/g, 'Ё'],
  [/yo/g, 'ё'],
  [/YU/g, 'Ю'],
  [/Yu/g, 'Ю'],
  [/yu/g, 'ю'],
  [/YA/g, 'Я'],
  [/Ya/g, 'Я'],
  [/ya/g, 'я'],
  // Initial YE
  [/(^|[\s\p{P}])Ye/gu, '$1Е'],
  [/(^|[\s\p{P}])ye/gu, '$1е'],
  // Vowel followed by ye
  [/([aeiouoʻAEIOUOʻ])ye/gi, (_match: string, v: string) => v + 'е'],
  // Apostrophe (tutuq belgisi)
  [/[ʻ'‘ʼ`]/g, 'ъ'],
];

const SINGLE_LAT_TO_CYR: Record<string, string> = {
  A: 'А', a: 'а',
  B: 'Б', b: 'б',
  D: 'Д', d: 'д',
  E: 'Э', e: 'э', // default when converted individually
  F: 'Ф', f: 'ф',
  G: 'Г', g: 'г',
  H: 'Ҳ', h: 'ҳ',
  I: 'И', i: 'и',
  J: 'Ж', j: 'ж',
  K: 'К', k: 'к',
  L: 'Л', l: 'л',
  M: 'М', m: 'м',
  N: 'Н', n: 'н',
  O: 'О', o: 'о',
  P: 'П', p: 'п',
  Q: 'Қ', q: 'қ',
  R: 'Р', r: 'р',
  S: 'С', s: 'с',
  T: 'Т', t: 'т',
  U: 'У', u: 'у',
  V: 'В', v: 'в',
  X: 'Х', x: 'х',
  Y: 'Й', y: 'й',
  Z: 'З', z: 'з',
};

export function latinToCyrillic(text: string): string {
  if (!text) return '';
  let res = text;

  // Apply multi-letter patterns first
  for (const [pattern, replacement] of LATIN_TO_CYRILLIC_PAIRS) {
    res = res.replace(pattern, replacement as any);
  }

  // Handle 'E' / 'e' at word start vs 'Э' / 'э'
  res = res.replace(/(^|[\s\p{P}])E/gu, '$1Э');
  res = res.replace(/(^|[\s\p{P}])e/gu, '$1э');

  // Replace remaining single letters
  let out = '';
  for (let i = 0; i < res.length; i++) {
    const char = res[i];
    out += SINGLE_LAT_TO_CYR[char] || char;
  }

  return out;
}

const CYRILLIC_TO_LATIN_PAIRS: [RegExp, string][] = [
  // E at start of word or after vowel -> ye
  [/(^|[\s\p{P}])Е/gu, '$1Ye'],
  [/(^|[\s\p{P}])е/gu, '$1ye'],
  [/([аеёиоуэюяАЕЁИОУЭЮЯ])Е/g, '$1Ye'],
  [/([аеёиоуэюяАЕЁИОУЭЮЯ])е/g, '$1ye'],
  [/Ш/g, 'Sh'],
  [/ш/g, 'sh'],
  [/Ч/g, 'Ch'],
  [/ч/g, 'ch'],
  [/Ў/g, 'Oʻ'],
  [/ў/g, 'oʻ'],
  [/Ғ/g, 'Gʻ'],
  [/ғ/g, 'gʻ'],
  [/Ё/g, 'Yo'],
  [/ё/g, 'yo'],
  [/Ю/g, 'Yu'],
  [/ю/g, 'yu'],
  [/Я/g, 'Ya'],
  [/я/g, 'ya'],
  [/Ц/g, 'Ts'],
  [/ц/g, 'ts'],
  [/Щ/g, 'Sh'],
  [/щ/g, 'sh'],
];

const SINGLE_CYR_TO_LAT: Record<string, string> = {
  А: 'A', а: 'a',
  Б: 'B', б: 'b',
  В: 'V', в: 'v',
  Г: 'G', г: 'g',
  Д: 'D', д: 'd',
  Е: 'E', е: 'e',
  Ж: 'J', ж: 'j',
  З: 'Z', з: 'z',
  И: 'I', и: 'i',
  Й: 'Y', й: 'y',
  К: 'K', к: 'k',
  Л: 'L', л: 'l',
  М: 'M', м: 'm',
  Н: 'N', н: 'n',
  О: 'O', о: 'o',
  П: 'P', п: 'p',
  Р: 'R', р: 'r',
  С: 'S', с: 's',
  Т: 'T', т: 't',
  У: 'U', у: 'u',
  Ф: 'F', ф: 'f',
  Х: 'X', х: 'x',
  Ҳ: 'H', ҳ: 'h',
  Ч: 'Ch', ч: 'ch',
  Ш: 'Sh', ш: 'sh',
  Ъ: '’', ъ: '’',
  Ь: '', ь: '',
  Э: 'E', э: 'e',
  Қ: 'Q', қ: 'q',
};

export function cyrillicToLatin(text: string): string {
  if (!text) return '';
  let res = text;

  for (const [pattern, replacement] of CYRILLIC_TO_LATIN_PAIRS) {
    res = res.replace(pattern, replacement);
  }

  let out = '';
  for (let i = 0; i < res.length; i++) {
    const char = res[i];
    out += SINGLE_CYR_TO_LAT[char] !== undefined ? SINGLE_CYR_TO_LAT[char] : char;
  }

  return out;
}
