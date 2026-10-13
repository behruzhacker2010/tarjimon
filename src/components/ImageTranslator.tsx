import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  RefreshCw,
  Copy,
  Check,
  Volume2,
  Trash2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { LANGUAGES, UI_STRINGS } from '../utils/languages';
import { ImageTranslationResponse } from '../types';
import { speakText } from '../utils/speech';

interface ImageTranslatorProps {
  uiLang: 'uz' | 'en' | 'ru';
}

export const ImageTranslator: React.FC<ImageTranslatorProps> = ({ uiLang }) => {
  const strings = UI_STRINGS[uiLang];
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [targetLang, setTargetLang] = useState<string>('uz-latn');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ImageTranslationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedExtracted, setCopiedExtracted] = useState<boolean>(false);
  const [copiedTranslated, setCopiedTranslated] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Iltimos, rasm faylini tanlang (JPG, PNG, WEBP)');
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Paste image from clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          setMimeType(file.type);
          const reader = new FileReader();
          reader.onload = () => {
            setSelectedImage(reader.result as string);
            setResult(null);
            setError(null);
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const handleTranslateImage = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/translate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          targetLang,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Rasmdan matnni aniqlashda xatolik yuz berdi');
      }

      const data: ImageTranslationResponse = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onPaste={handlePaste}
      tabIndex={0}
      className="w-full focus:outline-hidden"
    >
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-sky-400" />
              <span>{strings.imageTab}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Rasm, hujjat yoki fotosuratlardagi matnni tanib oling va tarjima qiling (Ctrl+V orqali ham vstavka qilish mumkin)
            </p>
          </div>

          {/* Target language */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Tarjima tili:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs rounded-lg px-3 py-1.5 border border-slate-800 focus:outline-hidden"
            >
              {LANGUAGES.filter((l) => l.code !== 'auto').map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload or Drop Area */}
        {!selectedImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/80 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-sky-400 group-hover:scale-105 transition-all shadow-md">
              <Upload className="w-6 h-6" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-200">
              Rasm yuklash uchun bosing yoki faylni bu yerga tortib keling
            </p>
            <p className="mt-1 text-xs text-slate-500">
              PNG, JPG, WEBP formatlar qoʻllab-quvvatlanadi (Skrinshotni Ctrl+V orqali qoʻyish mumkin)
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Preview & Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-32 h-32 object-cover rounded-xl border border-slate-700/80 shrink-0 shadow-md"
              />
              <div className="flex-1 w-full flex flex-col justify-between h-full gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">Tanlangan rasm</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {mimeType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    AI matnni aniqlashga va tarjima qilishga tayyor
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTranslateImage}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors shadow-md shadow-sky-500/20 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Matnni aniqlash va tarjima qilish</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setResult(null);
                      setError(null);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                    title={strings.clear}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Results Display */}
            {result && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Extracted Original Text */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Rasmdagi asl matn ({result.detectedLang})
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(result.extractedText);
                          setCopiedExtracted(true);
                          setTimeout(() => setCopiedExtracted(false), 2000);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title={strings.copy}
                      >
                        {copiedExtracted ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {result.extractedText}
                    </p>
                  </div>
                  {result.summary && (
                    <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60 italic">
                      Izoh: {result.summary}
                    </p>
                  )}
                </div>

                {/* Translated Text */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                      <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                        Tarjima natijasi
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => speakText(result.translatedText, targetLang)}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title={strings.listen}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(result.translatedText);
                            setCopiedTranslated(true);
                            setTimeout(() => setCopiedTranslated(false), 2000);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title={strings.copy}
                        >
                          {copiedTranslated ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-100 font-medium leading-relaxed whitespace-pre-wrap">
                      {result.translatedText}
                    </p>
                  </div>

                  {/* If Uzbek Cyrillic alternative available */}
                  {result.scriptConversion?.uzbekCyrillic && targetLang === 'uz-latn' && (
                    <div className="mt-3 pt-2 border-t border-slate-800/60 text-xs">
                      <span className="text-slate-500 text-[11px] block">Кирилл алифбосида:</span>
                      <p className="text-slate-400 mt-0.5">{result.scriptConversion.uzbekCyrillic}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
