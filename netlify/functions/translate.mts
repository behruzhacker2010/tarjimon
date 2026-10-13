import type { Config } from '@netlify/functions';
import { callGeminiSafe, errorResponse, getOfflineFallback, parseJson } from '../lib/gemini';

export default async (req: Request) => {
  try {
    const { text, sourceLang = 'auto', targetLang = 'uz-latn', tone = 'default' } = await req.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return errorResponse('Matn kiritilmadi (No text provided)', 400);
    }

    const languageNames: Record<string, string> = {
      'auto': 'Auto-detect source language',
      'uz-latn': 'Uzbek (Latin script / Oʻzbekcha lotin)',
      'uz-cyrl': 'Uzbek (Cyrillic script / Ўзбекча кирилл)',
      'en': 'English',
      'ru': 'Russian (Русский)',
      'tr': 'Turkish (Türkçe)',
      'ar': 'Arabic (العربية)',
      'de': 'German (Deutsch)',
      'fr': 'French (Français)',
      'es': 'Spanish (Español)',
      'zh': 'Chinese (中文)',
      'ja': 'Japanese (日本語)',
      'ko': 'Korean (한국어)',
      'kk': 'Kazakh (Қазақша)',
      'ky': 'Kyrgyz (Кыргызча)',
      'tg': 'Tajik (Тоҷикӣ)',
    };

    const targetDesc = languageNames[targetLang] || targetLang;
    const sourceDesc = languageNames[sourceLang] || sourceLang;

    const prompt = `You are an expert computational linguist and translator specialized in Uzbek (both Latin and Cyrillic scripts), English, Russian, and world languages.

Translate the following text:
Source Language: ${sourceDesc}
Target Language: ${targetDesc}
Requested Tone: ${tone} (e.g. formal, casual, academic, literary, slang, or default)

Input text:
"""
${text}
"""

Instructions:
1. Translate accurately and naturally into the target language.
   - For Uzbek Latin: use proper orthography (oʻ, gʻ, sh, ch).
   - For Uzbek Cyrillic: use proper letters (ў, ғ, ҳ, қ, ш, ч).
2. If text is a short word or phrase (under 6 words), provide a dictionary breakdown (partOfSpeech, definition, 2 bilingual examples).
3. Always respond ONLY in valid JSON matching this structure:
{
  "detectedSourceLang": "Language name or code",
  "translatedText": "Primary natural translation",
  "alternativeTranslations": ["alternative 1", "alternative 2"],
  "transliteration": "optional phonetic or Latin guide",
  "scriptConversion": {
    "uzbekLatin": "Uzbek Latin translation",
    "uzbekCyrillic": "Uzbek Cyrillic translation"
  },
  "dictionary": {
    "isWordLevel": true,
    "partOfSpeech": "noun / ot / fe'l",
    "definition": "definition in target language",
    "examples": [
      { "source": "example source", "target": "example target" }
    ],
    "grammarNote": "short grammar note",
    "culturalNote": "short cultural note"
  }
}`;

    try {
      const rawText = await callGeminiSafe(prompt, true);
      return Response.json(parseJson(rawText));
    } catch (apiErr: any) {
      console.warn('Gemini API call failed, attempting fallback...', apiErr.message);

      // Check quick offline dictionary
      const fallback = getOfflineFallback(text, targetLang);
      if (fallback) {
        return Response.json(fallback);
      }

      // If no dictionary match, do direct plain translation with simplest prompt
      const simplePrompt = `Translate the following text to ${targetDesc}: "${text}". Provide ONLY the translation, nothing else.`;
      const directText = await callGeminiSafe(simplePrompt, false);
      return Response.json({
        detectedSourceLang: sourceLang === 'auto' ? 'Auto' : sourceLang,
        translatedText: directText.trim(),
        alternativeTranslations: [],
      });
    }
  } catch (err: any) {
    console.error('Translation error:', err);
    return errorResponse(err.message || 'Tarjima qilishda xatolik yuz berdi');
  }
};

export const config: Config = {
  path: '/api/translate',
  method: 'POST',
};
