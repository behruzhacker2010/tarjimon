import type { Config } from '@netlify/functions';
import { callGeminiSafe, errorResponse, parseJson } from '../lib/gemini';

// Grammar / Style Polish
export default async (req: Request) => {
  try {
    const { text, lang = 'uz' } = await req.json();
    if (!text) {
      return errorResponse('Text required', 400);
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
    return Response.json(parseJson(raw));
  } catch (err: any) {
    console.error('Grammar check error:', err);
    return errorResponse(err.message || 'Grammar check failed');
  }
};

export const config: Config = {
  path: '/api/grammar-check',
  method: 'POST',
};
