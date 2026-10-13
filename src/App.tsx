/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TranslatorMain } from './components/TranslatorMain';
import { ImageTranslator } from './components/ImageTranslator';
import { ScriptConverter } from './components/ScriptConverter';
import { GrammarChecker } from './components/GrammarChecker';
import { Phrasebook } from './components/Phrasebook';
import { HistoryDrawer } from './components/HistoryDrawer';
import { HistoryItem } from './types';
import { UI_STRINGS } from './utils/languages';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'translate' | 'image' | 'script' | 'grammar' | 'phrasebook'>('translate');
  const [uiLang, setUiLang] = useState<'uz' | 'en' | 'ru'>('uz');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [prefilledText, setPrefilledText] = useState<string>('');

  // Load history & uiLang from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('tarjima_qiber_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
      const savedLang = localStorage.getItem('tarjima_qiber_lang') as 'uz' | 'en' | 'ru';
      if (savedLang && ['uz', 'en', 'ru'].includes(savedLang)) {
        setUiLang(savedLang);
      }
    } catch (e) {
      console.warn('Failed to load localStorage data', e);
    }
  }, []);

  const handleSaveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('tarjima_qiber_history', JSON.stringify(newHistory.slice(0, 50)));
    } catch (e) {}
  };

  const handleAddHistory = (itemData: Omit<HistoryItem, 'id' | 'timestamp' | 'favorite'>) => {
    // Avoid duplicate immediately adjacent items
    if (history.length > 0 && history[0].sourceText === itemData.sourceText && history[0].translatedText === itemData.translatedText) {
      return;
    }

    const newItem: HistoryItem = {
      ...itemData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      favorite: false,
    };

    const updated = [newItem, ...history].slice(0, 50);
    handleSaveHistory(updated);
  };

  const handleToggleFavorite = (item: HistoryItem) => {
    const existingIndex = history.findIndex((h) => h.id === item.id || (h.sourceText === item.sourceText && h.translatedText === item.translatedText));

    if (existingIndex >= 0) {
      const updated = [...history];
      updated[existingIndex] = {
        ...updated[existingIndex],
        favorite: !updated[existingIndex].favorite,
      };
      handleSaveHistory(updated);
    } else {
      const newItem: HistoryItem = {
        ...item,
        favorite: true,
      };
      handleSaveHistory([newItem, ...history]);
    }
  };

  const handleClearHistory = () => {
    handleSaveHistory([]);
  };

  const handleChangeUiLang = (lang: 'uz' | 'en' | 'ru') => {
    setUiLang(lang);
    try {
      localStorage.setItem('tarjima_qiber_lang', lang);
    } catch (e) {}
  };

  const handleUsePhrase = (phraseText: string) => {
    setPrefilledText(phraseText);
    setCurrentTab('translate');
  };

  return (
    <div className="min-h-screen bg-[#0c1017] text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        uiLang={uiLang}
        onChangeUiLang={handleChangeUiLang}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'translate' && (
          <TranslatorMain
            key={prefilledText}
            initialText={prefilledText}
            uiLang={uiLang}
            onAddHistory={handleAddHistory}
            favorites={history.filter((h) => h.favorite)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {currentTab === 'image' && <ImageTranslator uiLang={uiLang} />}

        {currentTab === 'script' && <ScriptConverter uiLang={uiLang} />}

        {currentTab === 'grammar' && <GrammarChecker uiLang={uiLang} />}

        {currentTab === 'phrasebook' && (
          <Phrasebook uiLang={uiLang} onUsePhrase={handleUsePhrase} />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950/60 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Tarjima Qiber</span>
            <span>·</span>
            <span>Oʻzbekcha, English, Русский va boshqa tillar uchun aqlli tarjimon</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Gemini 3.8 Flash</span>
            <span>·</span>
            <span>Lotin ⇄ Kirill qoʻllab-quvvatlanadi</span>
          </div>
        </div>
      </footer>

      {/* History & Favorites Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={(item) => {
          setPrefilledText(item.sourceText);
          setCurrentTab('translate');
        }}
        onToggleFavorite={handleToggleFavorite}
        onClearHistory={handleClearHistory}
        uiLang={uiLang}
      />
    </div>
  );
}
