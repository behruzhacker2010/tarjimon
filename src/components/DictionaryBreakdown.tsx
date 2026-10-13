import React from 'react';
import { BookMarked, Lightbulb, GraduationCap, Globe2, Sparkles, Volume2 } from 'lucide-react';
import { DictionaryData } from '../types';
import { UI_STRINGS } from '../utils/languages';

interface DictionaryBreakdownProps {
  dictionary: DictionaryData;
  alternatives?: string[];
  transliteration?: string;
  uiLang: 'uz' | 'en' | 'ru';
  onSelectAlternative?: (text: string) => void;
  onSpeak?: (text: string) => void;
}

export const DictionaryBreakdown: React.FC<DictionaryBreakdownProps> = ({
  dictionary,
  alternatives,
  transliteration,
  uiLang,
  onSelectAlternative,
  onSpeak,
}) => {
  const strings = UI_STRINGS[uiLang];

  const hasContent =
    dictionary.definition ||
    dictionary.partOfSpeech ||
    (dictionary.examples && dictionary.examples.length > 0) ||
    dictionary.grammarNote ||
    dictionary.culturalNote ||
    (alternatives && alternatives.length > 0);

  if (!hasContent) return null;

  return (
    <div className="mt-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl">
      {/* Title & Part of Speech Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
          <BookMarked className="w-4 h-4 text-sky-400" />
          <span>{strings.dictionaryTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          {dictionary.partOfSpeech && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
              {dictionary.partOfSpeech}
            </span>
          )}
          {transliteration && (
            <span className="text-xs font-mono text-slate-400">
              [{transliteration}]
            </span>
          )}
        </div>
      </div>

      {/* Definition */}
      {dictionary.definition && (
        <div className="mt-4">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {dictionary.definition}
          </p>
        </div>
      )}

      {/* Alternative translations */}
      {alternatives && alternatives.length > 0 && (
        <div className="mt-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            {strings.alternatives}
          </span>
          <div className="flex flex-wrap gap-2">
            {alternatives.map((alt, idx) => (
              <button
                key={idx}
                onClick={() => onSelectAlternative?.(alt)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition-colors flex items-center gap-1.5"
              >
                <span>{alt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Examples */}
      {dictionary.examples && dictionary.examples.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
            <span>{strings.examples}</span>
          </div>
          <div className="space-y-2.5">
            {dictionary.examples.map((ex, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-slate-200 font-medium">{ex.source}</p>
                  {onSpeak && (
                    <button
                      onClick={() => onSpeak(ex.source)}
                      className="text-slate-400 hover:text-sky-400 p-1 rounded transition-colors shrink-0"
                      title={strings.listen}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-slate-400 mt-1 pl-2 border-l-2 border-sky-500/40">
                  {ex.target}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammar & Cultural notes */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {dictionary.grammarNote && (
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400/90 mb-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{strings.grammarNote}</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{dictionary.grammarNote}</p>
          </div>
        )}

        {dictionary.culturalNote && (
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400/90 mb-1">
              <Globe2 className="w-3.5 h-3.5" />
              <span>{strings.culturalNote}</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{dictionary.culturalNote}</p>
          </div>
        )}
      </div>
    </div>
  );
};
