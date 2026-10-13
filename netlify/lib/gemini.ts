import { GoogleGenAI } from '@google/genai';

// AI Gateway injects GEMINI_API_KEY and GOOGLE_GEMINI_BASE_URL at runtime
export const ai = new GoogleGenAI({});

export const MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];

// Helper to safely call Gemini with model fallback
export async function callGeminiSafe(prompt: string, jsonMode = true): Promise<string> {
  let lastError: any = null;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: jsonMode
          ? {
              responseMimeType: 'application/json',
            }
          : undefined,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next... Reason:`, err.message || err.status);
      lastError = err;
    }
  }

  throw lastError || new Error('All models failed');
}

// Clean possible markdown code fences and parse JSON
export function parseJson(raw: string) {
  return JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim());
}

export function errorResponse(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}

// Built-in offline quick vocabulary & phrases for instant zero-failure fallback
const QUICK_OFFLINE_DICT: Record<string, { uzLatn: string; uzCyrl: string; ru: string; en: string }> = {
  'salom': { uzLatn: 'Salom', uzCyrl: 'Салом', ru: 'Привет / Здравствуйте', en: 'Hello' },
  'assalomu alaykum': { uzLatn: 'Assalomu alaykum', uzCyrl: 'Ассалому алайкум', ru: 'Здравствуйте', en: 'Peace be upon you / Hello' },
  'hello': { uzLatn: 'Salom', uzCyrl: 'Салом', ru: 'Привет', en: 'Hello' },
  'hi': { uzLatn: 'Salom', uzCyrl: 'Салом', ru: 'Привет', en: 'Hi' },
  'привет': { uzLatn: 'Salom', uzCyrl: 'Салом', ru: 'Привет', en: 'Hello' },
  'здравствуйте': { uzLatn: 'Assalomu alaykum', uzCyrl: 'Ассалому алайкум', ru: 'Здравствуйте', en: 'Hello / Good day' },
  'rahmat': { uzLatn: 'Rahmat', uzCyrl: 'Раҳмат', ru: 'Спасибо', en: 'Thank you' },
  'katta rahmat': { uzLatn: 'Katta rahmat', uzCyrl: 'Катта раҳмат', ru: 'Большое спасибо', en: 'Thank you very much' },
  'thank you': { uzLatn: 'Rahmat', uzCyrl: 'Раҳмат', ru: 'Спасибо', en: 'Thank you' },
  'thanks': { uzLatn: 'Rahmat', uzCyrl: 'Раҳмат', ru: 'Спасибо', en: 'Thanks' },
  'спасибо': { uzLatn: 'Rahmat', uzCyrl: 'Раҳмат', ru: 'Спасибо', en: 'Thank you' },
  'yaxshi': { uzLatn: 'Yaxshi', uzCyrl: 'Яхши', ru: 'Хорошо', en: 'Good / Well' },
  'good': { uzLatn: 'Yaxshi', uzCyrl: 'Яхши', ru: 'Хорошо', en: 'Good' },
  'how are you': { uzLatn: 'Qandaysiz? Ishlar yaxshimi?', uzCyrl: 'Қандайсиз? Ишлар яхшими?', ru: 'Как дела?', en: 'How are you?' },
  'ishlaringiz qanday': { uzLatn: 'Ishlaringiz qanday?', uzCyrl: 'Ишларингиз қандай?', ru: 'Как ваши дела?', en: 'How are things?' },
  'xayr': { uzLatn: 'Xayr', uzCyrl: 'Хайр', ru: 'До свидания', en: 'Goodbye' },
  'bye': { uzLatn: 'Xayr', uzCyrl: 'Хайр', ru: 'Пока', en: 'Bye' },
  'goodbye': { uzLatn: 'Xayr', uzCyrl: 'Хайр', ru: 'До свидания', en: 'Goodbye' },
  'ha': { uzLatn: 'Ha', uzCyrl: 'Ҳа', ru: 'Да', en: 'Yes' },
  'yoʻq': { uzLatn: 'Yoʻq', uzCyrl: 'Йўқ', ru: 'Нет', en: 'No' },
  'yoq': { uzLatn: 'Yoʻq', uzCyrl: 'Йўқ', ru: 'Нет', en: 'No' },
  'yes': { uzLatn: 'Ha', uzCyrl: 'Ҳа', ru: 'Да', en: 'Yes' },
  'no': { uzLatn: 'Yoʻq', uzCyrl: 'Йўқ', ru: 'Нет', en: 'No' },
  'iltimos': { uzLatn: 'Iltimos', uzCyrl: 'Илтимос', ru: 'Пожалуйста', en: 'Please' },
  'please': { uzLatn: 'Iltimos', uzCyrl: 'Илтимос', ru: 'Пожалуйста', en: 'Please' },
  'пожалуйста': { uzLatn: 'Iltimos / Arzimaydi', uzCyrl: 'Илтимос / Арзимайди', ru: 'Пожалуйста', en: 'Please / You are welcome' },
};

export function getOfflineFallback(text: string, targetLang: string) {
  const clean = text.trim().toLowerCase();
  const match = QUICK_OFFLINE_DICT[clean];
  if (match) {
    let trans = match.uzLatn;
    if (targetLang === 'uz-cyrl') trans = match.uzCyrl;
    else if (targetLang === 'en') trans = match.en;
    else if (targetLang === 'ru') trans = match.ru;

    return {
      detectedSourceLang: 'Auto',
      translatedText: trans,
      alternativeTranslations: [match.uzLatn, match.en, match.ru].filter(t => t !== trans),
      scriptConversion: {
        uzbekLatin: match.uzLatn,
        uzbekCyrillic: match.uzCyrl,
      },
    };
  }
  return null;
}

