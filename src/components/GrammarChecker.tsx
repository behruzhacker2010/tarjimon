import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { GrammarResponse } from '../types';
import { UI_STRINGS } from '../utils/languages';

interface GrammarCheckerProps {
  uiLang: 'uz' | 'en' | 'ru';
}

export const GrammarChecker: React.FC<GrammarCheckerProps> = ({ uiLang }) => {
  const strings = UI_STRINGS[uiLang];
  const [text, setText] = useState<string>('');
  const [lang, setLang] = useState<string>('uz');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<GrammarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCheck = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/grammar-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });

      if (!response.ok) {
        throw new Error('Matnni tekshirishda xatolik yuz berdi');
      }

      const data: GrammarResponse = await response.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCorrected = () => {
    if (!result?.correctedText) return;
    navigator.clipboard.writeText(result.correctedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSample = () => {
    setText(
      'Biz kecha dustlarim bilan uchrashuv otdik va kop narsalarni gaplashdik lekin qoyilgan vazifalar hali bajarilmapti.'
    );
  };

  return (
    <div className="w-full">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-sky-400" />
              <span>Grammatika & Imlo Tekshiruvi</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Imlo, tinish belgilari va stilistik xatoliklarni aniqlash va tuzatish
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs rounded-lg px-3 py-1.5 border border-slate-800 focus:outline-hidden"
            >
              <option value="uz">🇺🇿 Oʻzbek tili</option>
              <option value="en">🇬🇧 English</option>
              <option value="ru">🇷🇺 Русский язык</option>
            </select>

            <button
              onClick={handleCheck}
              disabled={isLoading || !text.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Tekshirish</span>
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
            <span className="font-semibold text-slate-400 uppercase tracking-wider">
              Tekshiriladigan matn
            </span>
            <div className="flex items-center gap-2">
              <button onClick={loadSample} className="text-[11px] text-sky-400 hover:underline">
                Xatoli namuna yuklash
              </button>
              {text && (
                <button
                  onClick={() => {
                    setText('');
                    setResult(null);
                  }}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tekshirmoqchi boʻlgan matningizni kiriting..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-600 text-sm resize-none focus:outline-hidden min-h-[140px] leading-relaxed"
          />
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* Corrected Text Card */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Tahrirlangan va toʻgʻrilangan variant</span>
                </div>
                <button
                  onClick={handleCopyCorrected}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{strings.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{strings.copy}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {result.correctedText}
              </p>
            </div>

            {/* List of Improvements */}
            {result.improvements && result.improvements.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Aniqlangan xatoliklar va izohlar ({result.improvements.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.improvements.map((imp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2 font-mono">
                        <span className="line-through text-rose-400/80">{imp.original}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-emerald-400 font-semibold">{imp.suggestion}</span>
                      </div>
                      <p className="text-slate-400 mt-1.5 leading-relaxed">{imp.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
