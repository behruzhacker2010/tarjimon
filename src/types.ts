export type ToneType = 'default' | 'formal' | 'casual' | 'academic' | 'literary' | 'slang';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

export interface DictionaryData {
  isWordLevel?: boolean;
  partOfSpeech?: string;
  definition?: string;
  examples?: Array<{
    source: string;
    target: string;
  }>;
  grammarNote?: string;
  culturalNote?: string;
}

export interface TranslationResponse {
  detectedSourceLang: string;
  translatedText: string;
  alternativeTranslations?: string[];
  transliteration?: string;
  scriptConversion?: {
    uzbekLatin?: string;
    uzbekCyrillic?: string;
  };
  dictionary?: DictionaryData;
}

export interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  favorite: boolean;
  tone?: ToneType;
}

export interface ImageTranslationResponse {
  extractedText: string;
  detectedLang: string;
  translatedText: string;
  summary?: string;
  scriptConversion?: {
    uzbekLatin?: string;
    uzbekCyrillic?: string;
  };
}

export interface GrammarCorrection {
  original: string;
  suggestion: string;
  explanation: string;
}

export interface GrammarResponse {
  correctedText: string;
  hasErrors: boolean;
  improvements: GrammarCorrection[];
  score?: number;
}
