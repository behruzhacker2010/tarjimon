import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRightLeft,
  Volume2,
  Copy,
  Check,
  Mic,
  MicOff,
  Trash2,
  Clipboard,
  Star,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Radio,
  Share2,
} from 'lucide-react';
import { LANGUAGES, UI_STRINGS } from '../utils/languages';
import { TranslationResponse, ToneType, HistoryItem } from '../types';
import { DictionaryBreakdown } from './DictionaryBreakdown';
import { speakText, playBase64Audio, createSpeechRecognizer } from '../utils/speech';
import { latinToCyrillic, cyrillicToLatin } from '../utils/uzbekTranslit';

interface TranslatorMainProps {
  initialText?: string;
  uiLang: 'uz' | 'en' | 'ru';
  onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'favorite'>) => void;
  favorites: HistoryItem[];
  onToggleFavorite: (item: HistoryItem) => void;
}

export const TranslatorMain: React.FC<TranslatorMainProps> = ({
  initialText,
  uiLang,
  onAddHistory,
  favorites,
  onToggleFavorite,
}) => {
  const strings = UI_STRINGS[uiLang];

  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('uz-latn');
  const [sourceText, setSourceText] = useState<string>(initialText || '');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [detectedLang, setDetectedLang] = useState<string>('');
  const [tone, setTone] = useState<ToneType>('default');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isPlayingAiVoice, setIsPlayingAiVoice] = useState<boolean>(false);
  const [translationData, setTranslationData] = useState<TranslationResponse | null>(null);
  const [displayScript, setDisplayScript] = useState<'current' | 'latin' | 'cyrillic'>('current');
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<{ start: () => void; stop: () => void; isSupported: boolean } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick selectable languages
  const quickSourceLangs = ['auto', 'uz-latn', 'en', 'ru', 'tr'];
  const quickTargetLangs = ['uz-latn', 'uz-cyrl', 'en', 'ru', 'tr'];

  // Handle translation
  const handleTranslate = useCallback(
    async (textOverride?: string) => {
      const textToTranslate = textOverride !== undefined ? textOverride : sourceText;
      if (!textToTranslate || textToTranslate.trim() === '') {
        setTranslatedText('');
        setTranslationData(null);
        setDetectedLang('');
        setIsLoading(false);
        return;
      }

      // Instant local script conversion if between Uzbek Latin and Cyrillic
      if (
        (sourceLang === 'uz-latn' && targetLang === 'uz-cyrl') ||
        (sourceLang === 'uz-cyrl' && targetLang === 'uz-latn')
      ) {
        const instant =
          sourceLang === 'uz-latn'
            ? latinToCyrillic(textToTranslate)
            : cyrillicToLatin(textToTranslate);
        setTranslatedText(instant);
      }

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      // Timeout after 12 seconds
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 12000);

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            text: textToTranslate,
            sourceLang,
            targetLang,
            tone,
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Tarjima qilishda xatolik yuz berdi');
        }

        const data: TranslationResponse = await response.json();
        setTranslationData(data);
        setTranslatedText(data.translatedText);
        setDetectedLang(data.detectedSourceLang);
        setDisplayScript('current');

        // Add to history
        onAddHistory({
          sourceText: textToTranslate,
          translatedText: data.translatedText,
          sourceLang: sourceLang === 'auto' ? data.detectedSourceLang : sourceLang,
          targetLang,
          tone,
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Ignore cancelled requests
          return;
        }
        console.error('Translation failed:', err);

        // Fallback: check if local script conversion works
        if (targetLang === 'uz-cyrl') {
          setTranslatedText(latinToCyrillic(textToTranslate));
        } else if (targetLang === 'uz-latn' && (sourceLang === 'uz-cyrl' || /[\u0400-\u04FF]/.test(textToTranslate))) {
          setTranslatedText(cyrillicToLatin(textToTranslate));
        } else {
          setError(err.message || 'Xatolik yuz berdi. Iltimos qaytadan urinib koʻring.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [sourceText, sourceLang, targetLang, tone, onAddHistory]
  );

  // Debounced auto-translation
  useEffect(() => {
    if (!autoTranslate) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!sourceText.trim()) {
      setTranslatedText('');
      setTranslationData(null);
      setDetectedLang('');
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      handleTranslate();
    }, 700);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [sourceText, sourceLang, targetLang, tone, autoTranslate, handleTranslate]);

  // Swap languages
  const handleSwap = () => {
    let newSource = targetLang;
    let newTarget = sourceLang;

    if (sourceLang === 'auto') {
      // If was auto, try to use detected or default to english
      newTarget = detectedLang.toLowerCase().includes('uzbek') || detectedLang.toLowerCase().includes('oʻzbek')
        ? 'uz-latn'
        : detectedLang.toLowerCase().includes('russian') || detectedLang.toLowerCase().includes('рус')
        ? 'ru'
        : 'en';
    }

    setSourceLang(newSource);
    setTargetLang(newTarget);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
    setDisplayScript('current');
  };

  // Copy translated text
  const handleCopy = () => {
    const textToCopy = getDisplayedText();
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Voice recording (Microphone STT)
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const rec = createSpeechRecognizer(
      sourceLang === 'auto' ? 'uz-latn' : sourceLang,
      (text, isFinal) => {
        setSourceText((prev) => {
          const newText = prev ? `${prev} ${text}` : text;
          return newText;
        });
        if (isFinal) {
          recognitionRef.current?.stop();
          setIsRecording(false);
        }
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
      }
    );

    if (rec.isSupported) {
      recognitionRef.current = rec;
      rec.start();
      setIsRecording(true);
    } else {
      alert('Brauzeringiz ovozli kiritishni qoʻllab-quvvatlamaydi (Speech recognition unavailable)');
    }
  };

  // Browser Audio Pronunciation
  const handleListen = async (text: string, lang: string) => {
    if (!text || isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      await speakText(text, lang);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Gemini AI High-Fidelity TTS
  const handleAiVoice = async () => {
    const text = getDisplayedText();
    if (!text || isPlayingAiVoice) return;
    setIsPlayingAiVoice(true);
    try {
      const res = await fetch('/api/tts-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Kore' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          await playBase64Audio(data.audioBase64);
        }
      } else {
        // Fallback to browser speech
        await speakText(text, targetLang);
      }
    } catch (e) {
      // Fallback
      await speakText(text, targetLang);
    } finally {
      setIsPlayingAiVoice(false);
    }
  };

  // Uzbek Script Toggle for target text
  const getDisplayedText = (): string => {
    if (!translatedText) return '';
    if (displayScript === 'latin') {
      return cyrillicToLatin(translatedText);
    }
    if (displayScript === 'cyrillic') {
      return latinToCyrillic(translatedText);
    }
    return translatedText;
  };

  // Check if target is Uzbek
  const isTargetUzbek = targetLang === 'uz-latn' || targetLang === 'uz-cyrl';

  // Toggle favorite for current translation
  const isFavorite = favorites.some(
    (f) => f.sourceText === sourceText && f.translatedText === translatedText
  );

  const handleFavoriteClick = () => {
    if (!sourceText || !translatedText) return;
    onToggleFavorite({
      id: `${Date.now()}`,
      sourceText,
      translatedText,
      sourceLang,
      targetLang,
      timestamp: Date.now(),
      favorite: !isFavorite,
      tone,
    });
  };

  return (
    <div className="w-full">
      {/* Top Controls: Tone & Auto-translate toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Tone Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            <span>{strings.toneLabel}</span>
          </span>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            {(
              [
                { id: 'default', label: strings.toneDefault },
                { id: 'formal', label: strings.toneFormal },
                { id: 'casual', label: strings.toneCasual },
                { id: 'academic', label: strings.toneAcademic },
                { id: 'literary', label: strings.toneLiterary },
                { id: 'slang', label: strings.toneSlang },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  tone === t.id
                    ? 'bg-sky-500 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Auto translate toggle */}
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoTranslate}
            onChange={(e) => setAutoTranslate(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 cursor-pointer"
          />
          <span>Avtomatik tarjima (Auto-translate)</span>
        </label>
      </div>

      {/* Main Dual-Pane Translator Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Language Selection Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 bg-slate-950/60 border-b border-slate-800">
          {/* Source Lang Selection */}
          <div className="p-3 sm:px-4 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
              {quickSourceLangs.map((code) => {
                const lang = LANGUAGES.find((l) => l.code === code);
                if (!lang) return null;
                const active = sourceLang === code;
                return (
                  <button
                    key={code}
                    onClick={() => setSourceLang(code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                  </button>
                );
              })}

              {/* All languages select */}
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-slate-900 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 border border-slate-800 hover:border-slate-700 focus:outline-hidden"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {detectedLang && sourceLang === 'auto' && (
              <span className="text-[11px] text-sky-400 font-medium px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/50 shrink-0">
                {detectedLang}
              </span>
            )}
          </div>

          {/* Swap & Target Lang Selection */}
          <div className="p-3 sm:px-4 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
              {/* Swap Button */}
              <button
                onClick={handleSwap}
                disabled={isLoading}
                title={strings.swapLangs}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors mr-1 shrink-0"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>

              {quickTargetLangs.map((code) => {
                const lang = LANGUAGES.find((l) => l.code === code);
                if (!lang) return null;
                const active = targetLang === code;
                return (
                  <button
                    key={code}
                    onClick={() => setTargetLang(code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                  </button>
                );
              })}

              {/* All languages select */}
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-slate-900 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 border border-slate-800 hover:border-slate-700 focus:outline-hidden"
              >
                {LANGUAGES.filter((l) => l.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Uzbek Latin <-> Cyrillic Quick Toggle */}
            {isTargetUzbek && translatedText && (
              <div className="flex items-center gap-1 shrink-0 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => setDisplayScript('latin')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    displayScript === 'latin' || (displayScript === 'current' && targetLang === 'uz-latn')
                      ? 'bg-slate-800 text-sky-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Lotin yozuvida koʻrish"
                >
                  Lotin
                </button>
                <button
                  onClick={() => setDisplayScript('cyrillic')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    displayScript === 'cyrillic' || (displayScript === 'current' && targetLang === 'uz-cyrl')
                      ? 'bg-slate-800 text-sky-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Кирилл ёзувида кўриш"
                >
                  Кирилл
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dual Input/Output Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 min-h-[260px]">
          {/* Source Text Area */}
          <div className="p-4 sm:p-5 flex flex-col justify-between relative bg-slate-900/40">
            <textarea
              ref={textareaRef}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleTranslate();
                }
              }}
              placeholder={strings.sourcePlaceholder}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-base sm:text-lg resize-none focus:outline-hidden min-h-[170px] leading-relaxed"
            />

            {/* Source Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                {/* Voice Input */}
                <button
                  onClick={toggleRecording}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isRecording ? strings.stopVoice : strings.voiceInput}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Speak Source */}
                {sourceText && (
                  <button
                    onClick={() => handleListen(sourceText, sourceLang === 'auto' ? 'uz-latn' : sourceLang)}
                    disabled={isPlayingAudio}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title={strings.listen}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}

                {/* Paste from clipboard */}
                <button
                  onClick={async () => {
                    try {
                      const clip = await navigator.clipboard.readText();
                      if (clip) setSourceText((prev) => (prev ? `${prev} ${clip}` : clip));
                    } catch (e) {}
                  }}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Vstavka (Paste)"
                >
                  <Clipboard className="w-4 h-4" />
                </button>

                {/* Clear */}
                {sourceText && (
                  <button
                    onClick={() => {
                      setSourceText('');
                      setTranslatedText('');
                      setTranslationData(null);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                    title={strings.clear}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Character & Word counter */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                <span>{sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0} soʻz</span>
                <span>·</span>
                <span>{sourceText.length} belgi</span>
              </div>
            </div>
          </div>

          {/* Target Text Area */}
          <div className="p-4 sm:p-5 flex flex-col justify-between bg-slate-900/60 relative">
            <div className="min-h-[170px]">
              {isLoading ? (
                <div className="flex items-center gap-3 text-slate-400 text-sm py-8">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span>{strings.translating}</span>
                </div>
              ) : error ? (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                  {error}
                </div>
              ) : translatedText ? (
                <div className="text-slate-100 text-base sm:text-lg leading-relaxed whitespace-pre-wrap select-text">
                  {getDisplayedText()}
                </div>
              ) : (
                <p className="text-slate-600 text-base sm:text-lg select-none">
                  {strings.targetPlaceholder}
                </p>
              )}
            </div>

            {/* Target Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                {translatedText && (
                  <>
                    {/* Listen Web Speech */}
                    <button
                      onClick={() => handleListen(getDisplayedText(), targetLang)}
                      disabled={isPlayingAudio}
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      title={strings.listen}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {/* Gemini AI High-Fidelity Voice */}
                    <button
                      onClick={handleAiVoice}
                      disabled={isPlayingAiVoice}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        isPlayingAiVoice
                          ? 'bg-sky-500 text-white border-sky-400'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 text-sky-300 border-sky-500/30'
                      }`}
                      title="Gemini yuqori sifatli audio ovoz"
                    >
                      <Radio className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">{strings.aiVoice}</span>
                    </button>

                    {/* Copy to clipboard */}
                    <button
                      onClick={handleCopy}
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                      title={strings.copy}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-[11px] text-emerald-400">{strings.copied}</span>
                        </>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Favorite */}
                    <button
                      onClick={handleFavoriteClick}
                      className={`p-2 rounded-lg hover:bg-slate-800 transition-colors ${
                        isFavorite ? 'text-amber-400' : 'text-slate-400 hover:text-amber-300'
                      }`}
                      title="Saralanganlarga saqlash (Save to favorites)"
                    >
                      <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>
                  </>
                )}
              </div>

              {/* Manual Translate Button */}
              <div>
                <button
                  onClick={() => handleTranslate()}
                  disabled={isLoading || !sourceText.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{strings.translateBtn}</span>
                  <span className="hidden md:inline text-[10px] opacity-75 font-mono">
                    (Ctrl+Enter)
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dictionary Breakdown Card (When available) */}
      {translationData?.dictionary && (
        <DictionaryBreakdown
          dictionary={translationData.dictionary}
          alternatives={translationData.alternativeTranslations}
          transliteration={translationData.transliteration}
          uiLang={uiLang}
          onSelectAlternative={(alt) => setTranslatedText(alt)}
          onSpeak={(text) => handleListen(text, sourceLang === 'auto' ? 'uz-latn' : sourceLang)}
        />
      )}
    </div>
  );
};
