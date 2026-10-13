import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to safely call Gemini with model fallback
async function callGeminiSafe(prompt: string, jsonMode = true): Promise<string> {
  const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
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

function getOfflineFallback(text: string, targetLang: string) {
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

// Translation Endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang = 'auto', targetLang = 'uz-latn', tone = 'default' } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      res.status(400).json({ error: 'Matn kiritilmadi (No text provided)' });
      return;
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
      // Clean possible markdown code fences
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
      return;
    } catch (apiErr: any) {
      console.warn('Gemini API call failed, attempting fallback...', apiErr.message);

      // Check quick offline dictionary
      const fallback = getOfflineFallback(text, targetLang);
      if (fallback) {
        res.json(fallback);
        return;
      }

      // If no dictionary match, do direct plain translation with simplest prompt
      try {
        const simplePrompt = `Translate the following text to ${targetDesc}: "${text}". Provide ONLY the translation, nothing else.`;
        const directText = await callGeminiSafe(simplePrompt, false);
        const cleanDirect = directText.trim();
        res.json({
          detectedSourceLang: sourceLang === 'auto' ? 'Auto' : sourceLang,
          translatedText: cleanDirect,
          alternativeTranslations: [],
        });
        return;
      } catch (directErr: any) {
        throw directErr;
      }
    }
  } catch (err: any) {
    console.error('Translation error:', err);
    res.status(500).json({ error: err.message || 'Tarjima qilishda xatolik yuz berdi' });
  }
});

// Image Translation (OCR + Translate)
app.post('/api/translate-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', targetLang = 'uz-latn', tone = 'default' } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Rasm yuborilmadi (No image data)' });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    const promptPart = {
      text: `Extract all readable text from this image and translate it into target language: ${targetLang} (tone: ${tone}).
Return ONLY valid JSON matching:
{
  "extractedText": "exact text from image",
  "detectedLang": "detected language",
  "translatedText": "fluent translation in ${targetLang}",
  "summary": "1-sentence description of image content",
  "scriptConversion": {
    "uzbekLatin": "uzbek latin version",
    "uzbekCyrillic": "uzbek cyrillic version"
  }
}`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: { parts: [imagePart, promptPart] },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const clean = (response.text || '{}').replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (err: any) {
    console.error('Image translation error:', err);
    res.status(500).json({ error: err.message || 'Image translation failed' });
  }
});

// Uzbek Script Converter (Lotin <-> Kirill)
app.post('/api/convert-uzbek', async (req, res) => {
  try {
    const { text, targetScript } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text required' });
      return;
    }

    const prompt = `Convert this Uzbek text to ${targetScript === 'cyrillic' ? 'Uzbek Cyrillic' : 'Uzbek Latin'}:
"${text}"
Return ONLY valid JSON: {"convertedText": "converted string"}`;

    const raw = await callGeminiSafe(prompt, true);
    const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (err: any) {
    console.error('Script conversion error:', err);
    res.status(500).json({ error: err.message || 'Conversion failed' });
  }
});

// Grammar / Style Polish
app.post('/api/grammar-check', async (req, res) => {
  try {
    const { text, lang = 'uz' } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text required' });
      return;
    }

    const prompt = `Check and correct the following text in ${lang} for grammar, spelling, punctuation, and style:
"${text}"

Return ONLY valid JSON:
{
  "correctedText": "corrected text",
  "hasErrors": true,
  "improvements": [
    { "original": "mistake", "suggestion": "correction", "explanation": "explanation in Uzbek or English" }
  ]
}`;

    const raw = await callGeminiSafe(prompt, true);
    const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (err: any) {
    console.error('Grammar check error:', err);
    res.status(500).json({ error: err.message || 'Grammar check failed' });
  }
});

// High quality TTS audio generation
app.post('/api/tts-audio', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text required' });
      return;
    }

    const speechText = text.slice(0, 300);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: speechText,
              speechMetadata: {
                style: 'Natural and clear',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      res.status(500).json({ error: 'Could not generate audio' });
      return;
    }

    res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
