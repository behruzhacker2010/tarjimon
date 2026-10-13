/**
 * Speech recognition and text-to-speech utilities
 */

export function speakText(text: string, langCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported in this browser'));
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Map language codes to BCP 47
    const langMap: Record<string, string> = {
      'uz-latn': 'uz-UZ',
      'uz-cyrl': 'uz-UZ',
      'en': 'en-US',
      'ru': 'ru-RU',
      'tr': 'tr-TR',
      'ar': 'ar-SA',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'kk': 'kk-KZ',
      'ky': 'ky-KG',
      'tg': 'tg-TJ',
    };

    utterance.lang = langMap[langCode] || langCode || 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve(); // gracefully resolve even if voice missing

    window.speechSynthesis.speak(utterance);
  });
}

export function playBase64Audio(base64Data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(`data:audio/wav;base64,${base64Data}`);
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

// Browser Web Speech Recognition helper
export function createSpeechRecognizer(
  langCode: string,
  onResult: (text: string, isFinal: boolean) => void,
  onError: (err: any) => void
): { start: () => void; stop: () => void; isSupported: boolean } {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      start: () => onError('Brauzer ovozli yozishni qoʻllab-quvvatlamaydi (Speech recognition not supported)'),
      stop: () => {},
      isSupported: false,
    };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  const langMap: Record<string, string> = {
    'uz-latn': 'uz-UZ',
    'uz-cyrl': 'uz-UZ',
    'en': 'en-US',
    'ru': 'ru-RU',
    'tr': 'tr-TR',
    'ar': 'ar-SA',
    'de': 'de-DE',
    'fr': 'fr-FR',
    'es': 'es-ES',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
  };

  recognition.lang = langMap[langCode] || 'uz-UZ';

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      onResult(finalTranscript, true);
    } else if (interimTranscript) {
      onResult(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    onError(event.error);
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (e) {
        // Already started or busy
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {}
    },
    isSupported: true,
  };
}
