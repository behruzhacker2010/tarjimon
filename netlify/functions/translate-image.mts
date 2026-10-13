import type { Config } from '@netlify/functions';
import { ai, errorResponse, parseJson } from '../lib/gemini';

// Image Translation (OCR + Translate)
export default async (req: Request) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', targetLang = 'uz-latn', tone = 'default' } = await req.json();

    if (!imageBase64) {
      return errorResponse('Rasm yuborilmadi (No image data)', 400);
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          {
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
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    return Response.json(parseJson(response.text || '{}'));
  } catch (err: any) {
    console.error('Image translation error:', err);
    return errorResponse(err.message || 'Image translation failed');
  }
};

export const config: Config = {
  path: '/api/translate-image',
  method: 'POST',
};
