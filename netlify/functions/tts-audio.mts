import type { Config } from '@netlify/functions';
import { errorResponse } from '../lib/gemini';

// Gemini TTS models are not available through Netlify AI Gateway.
// Returning an error makes the client fall back to browser speech synthesis.
export default async () => errorResponse('AI voice is unavailable, using browser speech', 503);

export const config: Config = {
  path: '/api/tts-audio',
  method: 'POST',
};
