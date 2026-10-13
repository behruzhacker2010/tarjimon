import React from 'react';
import { Languages, History, Sparkles, BookOpen, FileText, Camera, RefreshCw } from 'lucide-react';
import { UI_STRINGS } from '../utils/languages';

interface HeaderProps {
  currentTab: 'translate' | 'image' | 'script' | 'grammar' | 'phrasebook';
  onSelectTab: (tab: 'translate' | 'image' | 'script' | 'grammar' | 'phrasebook') => void;
  uiLang: 'uz' | 'en' | 'ru';
  onChangeUiLang: (lang: 'uz' | 'en' | 'ru') => void;
  historyCount: number;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  uiLang,
  onChangeUiLang,
  historyCount,
  onOpenHistory,
}) => {
  const strings = UI_STRINGS[uiLang];

  const tabs: Array<{ id: HeaderProps['currentTab']; label: string; icon: React.ReactNode }> = [
    { id: 'translate', label: strings.translateTab, icon: <Languages className="w-4 h-4" /> },
    { id: 'image', label: strings.imageTab, icon: <Camera className="w-4 h-4" /> },
    { id: 'script', label: strings.scriptTab, icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'grammar', label: strings.grammarTab, icon: <FileText className="w-4 h-4" /> },
    { id: 'phrasebook', label: strings.phrasebookTab, icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Tarjima Qiber</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  AI v3.8
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Oʻzbekcha · English · Русский & 100+ tillar
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {tabs.map((tab) => {
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: History & UI Language */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenHistory}
              title={strings.historyTitle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{strings.historyTitle}</span>
              {historyCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] flex items-center justify-center font-bold">
                  {historyCount}
                </span>
              )}
            </button>

            {/* UI Language Picker */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
              {(['uz', 'en', 'ru'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onChangeUiLang(lang)}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    uiLang === lang
                      ? 'bg-slate-800 text-sky-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          {tabs.map((tab) => {
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  active
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
