import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Shield, 
  Globe,
  BrainCircuit
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeDocument } from './services/geminiService';
import { AnalysisResult, Language } from './types';
import { translations } from './translations';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<Language>('ru');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useDeepAnalysis, setUseDeepAnalysis] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeDocument(file, language, useDeepAnalysis);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again. Ensure the document is readable.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Safe': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'Needs Review': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'Dangerous': return 'text-rose-500 bg-rose-50 border-rose-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-blue-100 text-blue-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Critical': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Helper to get translated verdict
  const getTranslatedVerdict = (verdict: string) => {
    const key = verdict === 'Needs Review' ? 'needsReview' : verdict.toLowerCase();
    // @ts-ignore
    return t.verdict[key] || verdict;
  };

  // Helper to get translated risk level
  const getTranslatedRiskLevel = (level: string) => {
    // @ts-ignore
    return t.riskLevels[level.toLowerCase()] || level;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900">
              {t.title} <span className="text-indigo-600 font-mono text-sm ml-1">{t.subtitle}</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              {(['en', 'ru', 'kz'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-md transition-all",
                    language === lang 
                      ? "bg-white text-indigo-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Intro Section */}
        <section className="text-center space-y-4 py-8">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {t.introTitle}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t.introText} <span className="font-semibold text-indigo-600">{t.introHighlight}</span>.
          </p>
        </section>

        {/* Upload Section */}
        <section 
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 transition-all text-center cursor-pointer",
            file ? "border-indigo-200 bg-indigo-50/50" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
          )}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
            accept=".pdf,.docx,.txt,.md,image/*"
          />
          
          <div className="flex flex-col items-center gap-4">
            {file ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex items-center gap-3"
              >
                <FileText className="w-8 h-8 text-indigo-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                  className="ml-4 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </motion.div>
            ) : (
              <>
                <div className="bg-indigo-100 p-4 rounded-full">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-slate-900">{t.uploadTitle}</p>
                  <p className="text-slate-500 mt-1">{t.uploadSubtitle}</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Controls & Action */}
        <div className="flex flex-col items-center gap-6">
          {/* Deep Analysis Toggle */}
          <div 
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-full border cursor-pointer transition-all select-none",
              useDeepAnalysis 
                ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                : "bg-white border-slate-200 hover:border-slate-300"
            )}
            onClick={() => setUseDeepAnalysis(!useDeepAnalysis)}
          >
            <div className={cn(
              "w-10 h-6 rounded-full relative transition-colors",
              useDeepAnalysis ? "bg-indigo-600" : "bg-slate-200"
            )}>
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                useDeepAnalysis ? "left-5" : "left-1"
              )} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <BrainCircuit className={cn("w-4 h-4", useDeepAnalysis ? "text-indigo-600" : "text-slate-400")} />
                {t.deepAnalysis}
              </span>
              <span className="text-xs text-slate-500">{t.deepAnalysisDesc}</span>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className={cn(
              "px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5",
              !file || isAnalyzing 
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none hover:translate-y-0" 
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.analyzingButton}
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                {t.analyzeButton}
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200 flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">{t.reportTitle}</h3>
                <div className={cn("px-4 py-2 rounded-full border font-bold flex items-center gap-2", getVerdictColor(result.verdict))}>
                  {result.verdict === 'Safe' && <CheckCircle className="w-5 h-5" />}
                  {result.verdict === 'Needs Review' && <AlertTriangle className="w-5 h-5" />}
                  {result.verdict === 'Dangerous' && <XCircle className="w-5 h-5" />}
                  {getTranslatedVerdict(result.verdict)}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.summaryTitle}</h4>
                <p className="text-slate-700 leading-relaxed">{result.summary}</p>
              </div>

              {/* Risks Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t.risksTitle}</h4>
                </div>
                
                {result.risks.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <p className="text-lg font-medium">{t.noRisksTitle}</p>
                    <p>{t.noRisksText}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {result.risks.map((risk, idx) => (
                      <div key={idx} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={cn("px-2 py-1 rounded text-xs font-bold uppercase shrink-0 mt-1", getRiskBadgeColor(risk.riskLevel))}>
                            {getTranslatedRiskLevel(risk.riskLevel)}
                          </div>
                          <div className="space-y-3 flex-1">
                            <div>
                              <p className="text-sm font-mono text-slate-500 mb-1">{t.clauseRef}</p>
                              <p className="font-medium text-slate-900 bg-slate-100 p-2 rounded border border-slate-200 text-sm">
                                "{risk.clause}"
                              </p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-bold text-rose-600 uppercase mb-1">{t.violation}</p>
                                <p className="text-sm text-slate-700">{risk.violation}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">{t.recommendation}</p>
                                <p className="text-sm text-slate-700">{risk.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
