import React, { useState } from 'react';
import {
  X,
  History,
  Star,
  Trash2,
  Copy,
  Check,
  Search,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { HistoryItem } from '../types';
import { UI_STRINGS } from '../utils/languages';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onToggleFavorite: (item: HistoryItem) => void;
  onClearHistory: () => void;
  uiLang: 'uz' | 'en' | 'ru';
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onToggleFavorite,
  onClearHistory,
  uiLang,
}) => {
  const strings = UI_STRINGS[uiLang];
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = history.filter((item) => {
    const matchesFilter = filter === 'all' || item.favorite;
    const matchesSearch =
      !searchQuery ||
      item.sourceText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translatedText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-base text-white">{strings.historyTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Barchasi ({history.length})
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors ${
                filter === 'favorites'
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400/80" />
              <span>{strings.favoritesTitle} ({history.filter((h) => h.favorite).length})</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tarixdan qidirish..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>{strings.noHistory}</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-sky-500/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {item.sourceLang} ➔ {item.targetLang}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item);
                      }}
                      className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                      title="Saralangan"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          item.favorite ? 'text-amber-400 fill-amber-400' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => handleCopy(e, item.translatedText, item.id)}
                      className="p-1 text-slate-500 hover:text-white transition-colors"
                      title={strings.copy}
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{item.sourceText}</p>
                <p className="text-xs font-semibold text-slate-200 mt-1 line-clamp-2">
                  {item.translatedText}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40">
            <button
              onClick={onClearHistory}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{strings.clearHistory}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
