import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Copy,
  Check,
  Trash2,
  Sparkles,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { latinToCyrillic, cyrillicToLatin } from '../utils/uzbekTranslit';
import { UI_STRINGS } from '../utils/languages';

interface ScriptConverterProps {
  uiLang: 'uz' | 'en' | 'ru';
}

export const ScriptConverter: React.FC<ScriptConverterProps> = ({ uiLang }) => {
  const strings = UI_STRINGS[uiLang];
  const [direction, setDirection] = useState<'lat2cyr' | 'cyr2lat'>('lat2cyr');
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [isAiPolishing, setIsAiPolishing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Real-time conversion
  useEffect(() => {
    if (!inputText) {
      setOutputText('');
      return;
    }

    if (direction === 'lat2cyr') {
      setOutputText(latinToCyrillic(inputText));
    } else {
      setOutputText(cyrillicToLatin(inputText));
    }
  }, [inputText, direction]);

  const handleSwapDirection = () => {
    setDirection((prev) => (prev === 'lat2cyr' ? 'cyr2lat' : 'lat2cyr'));
    setInputText(outputText);
    setOutputText(inputText);
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Optional AI Deep Polish for 100% orthographic perfection
  const handleAiPolish = async () => {
    if (!inputText.trim()) return;
    setIsAiPolishing(true);

    try {
      const response = await fetch('/api/convert-uzbek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          targetScript: direction === 'lat2cyr' ? 'cyrillic' : 'latin',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.convertedText) {
          setOutputText(data.convertedText);
        }
      }
    } catch (e) {
      console.warn('AI Polish fallback error:', e);
    } finally {
      setIsAiPolishing(false);
    }
  };

  // Sample texts
  const loadSample = (sampleType: 'latin' | 'cyrillic') => {
    if (sampleType === 'latin') {
      setDirection('lat2cyr');
      setInputText(
        'Oʻzbekiston Respublikasi — Markaziy Osiyodagi mustaqil davlat boʻlib, boy tarixiy va madaniy merosga ega. Alisher Navoiy, Mirzo Ulugʻbek kabi buyuk allomalar butun dunyoga mashhur.'
      );
    } else {
      setDirection('cyr2lat');
      setInputText(
        'Ўзбекистон Республикаси — Марказий Осиёдаги мустақил давлат бўлиб, бой тарихий ва маданий меросга эга. Алишер Навоий, Мирзо Улуғбек каби буюк алломалар бутун дунёга машҳур.'
      );
    }
  };

  return (
    <div className="w-full">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6">
        {/* Title and Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-sky-400" />
              <span>Oʻzbekcha Lotin ⇄ Kirill Almashtirgich</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Oʻzbek tili imlo qoidalariga toʻliq mos keluvchi tezkor matn konvertori
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Swap direction button */}
            <button
              onClick={handleSwapDirection}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <span>{direction === 'lat2cyr' ? 'Lotin ➔ Kirill' : 'Кирилл ➔ Lotin'}</span>
              <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
            </button>

            {/* AI Polish Button */}
            <button
              onClick={handleAiPolish}
              disabled={isAiPolishing || !inputText.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold transition-colors disabled:opacity-50"
              title="Qiyin soʻzlarni AI orqali tekshirish va tuzatish"
            >
              {isAiPolishing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span>AI Aniq Imlo</span>
            </button>
          </div>
        </div>

        {/* Dual Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Input Panel */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3 text-xs">
                <span className="font-semibold text-slate-400 uppercase tracking-wider">
                  {direction === 'lat2cyr' ? 'Lotin matni (Kiritish)' : 'Кирилл матни (Киритиш)'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadSample(direction === 'lat2cyr' ? 'latin' : 'cyrillic')}
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    Namuna yuklash
                  </button>
                  {inputText && (
                    <button
                      onClick={() => setInputText('')}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                      title={strings.clear}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  direction === 'lat2cyr'
                    ? 'Bu yerga Lotin yozuvidagi matnni kiriting...'
                    : 'Бу ерга Кирилл ёзувидаги матнни киритинг...'
                }
                className="w-full bg-transparent text-slate-100 placeholder-slate-600 text-sm resize-none focus:outline-hidden min-h-[220px] leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2 text-[11px] text-slate-500 font-mono">
              <span>{inputText.trim() ? inputText.trim().split(/\s+/).length : 0} soʻz</span>
              <span>{inputText.length} belgi</span>
            </div>
          </div>

          {/* Output Panel */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3 text-xs">
                <span className="font-semibold text-sky-400 uppercase tracking-wider">
                  {direction === 'lat2cyr' ? 'Кирилл матни (Натижа)' : 'Lotin matni (Natija)'}
                </span>
                <button
                  onClick={handleCopy}
                  disabled={!outputText}
                  className="flex items-center gap-1 text-slate-400 hover:text-white disabled:opacity-30"
                  title={strings.copy}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] text-emerald-400">{strings.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{strings.copy}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap min-h-[220px] select-text">
                {outputText || (
                  <span className="text-slate-600 select-none">
                    Konvertatsiya qilingan matn darhol bu yerda koʻrinadi...
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2 text-[11px] text-slate-500 font-mono">
              <span>{outputText.trim() ? outputText.trim().split(/\s+/).length : 0} soʻz</span>
              <span>{outputText.length} belgi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
