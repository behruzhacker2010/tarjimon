import React, { useState } from 'react';
import { BookOpen, Search, Copy, Check, Volume2, ArrowRight } from 'lucide-react';
import { CURATED_PHRASES, PhraseItem, UI_STRINGS } from '../utils/languages';
import { speakText } from '../utils/speech';

interface PhrasebookProps {
  uiLang: 'uz' | 'en' | 'ru';
  onUsePhrase: (text: string) => void;
}

export const Phrasebook: React.FC<PhrasebookProps> = ({ uiLang, onUsePhrase }) => {
  const strings = UI_STRINGS[uiLang];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: 'Barchasi (All)' },
    { id: 'Kundalik', label: 'Kundalik (Daily)' },
    { id: 'Sayohat', label: 'Sayohat (Travel)' },
    { id: 'Restoran', label: 'Taom & Restoran' },
    { id: 'IT', label: 'IT & Dasturlash' },
    { id: 'maqol', label: 'Oʻzbek maqollari' },
  ];

  const filteredPhrases = CURATED_PHRASES.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      p.uzLatn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.uzCyrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ru.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="w-full">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-400" />
              <span>{strings.phrasebookTab}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Eng koʻp ishlatiladigan suhbat iboralari, texnik atamalar va milliy maqollar
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Iborani qidirish..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar border-b border-slate-800/60">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-sky-500 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Phrase Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
          {filteredPhrases.map((phrase, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400/90">
                    {phrase.category.split('/')[0]}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => speakText(phrase.uzLatn, 'uz-latn')}
                      className="p-1 rounded text-slate-500 hover:text-sky-400"
                      title={strings.listen}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(phrase.uzLatn, idx)}
                      className="p-1 rounded text-slate-500 hover:text-white"
                      title={strings.copy}
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Uzbek Latin */}
                <p className="text-sm font-semibold text-slate-100">{phrase.uzLatn}</p>
                {/* Uzbek Cyrillic */}
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  {phrase.uzCyrl}
                </p>

                {/* English & Russian translations */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-1 text-xs">
                  <div className="flex items-baseline gap-1.5 text-slate-300">
                    <span className="text-[10px] font-mono text-slate-500">EN:</span>
                    <span>{phrase.en}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 text-slate-300">
                    <span className="text-[10px] font-mono text-slate-500">RU:</span>
                    <span>{phrase.ru}</span>
                  </div>
                </div>

                {phrase.explanation && (
                  <p className="text-[11px] text-amber-400/90 mt-2 bg-amber-950/20 p-2 rounded-lg border border-amber-800/30">
                    💡 {phrase.explanation}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2 flex items-center justify-end">
                <button
                  onClick={() => onUsePhrase(phrase.uzLatn)}
                  className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                >
                  <span>Tarjimonga yuklash</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
