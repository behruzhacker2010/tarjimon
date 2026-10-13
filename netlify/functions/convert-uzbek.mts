import type { Config } from '@netlify/functions';
import { callGeminiSafe, errorResponse, parseJson } from '../lib/gemini';

// Uzbek Script Converter (Lotin <-> Kirill)
export default async (req: Request) => {
  try {
    const { text, targetScript } = await req.json();
    if (!text) {
      return errorResponse('Text required', 400);
    }

    const prompt = `Convert this Uzbek text to ${targetScript === 'cyrillic' ? 'Uzbek Cyrillic' : 'Uzbek Latin'}:
"${text}"
Return ONLY valid JSON: {"convertedText": "converted string"}`;

    const raw = await callGeminiSafe(prompt, true);
    return Response.json(parseJson(raw));
  } catch (err: any) {
    console.error('Script conversion error:', err);
    return errorResponse(err.message || 'Conversion failed');
  }
};

export const config: Config = {
  path: '/api/convert-uzbek',
  method: 'POST',
};
