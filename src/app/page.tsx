'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sidebar } from '@/components/Sidebar';
import { InputSection } from '@/components/InputSection';
import { OutputArea } from '@/components/OutputArea';
import { useTranslation } from '@/hooks/useTranslation';
import RobotIcon from '../components/RobotIcon';
import { Sun, Moon, Menu, X, AlertCircle, Coins, CheckCircle } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

export default function Home() {
  const { t, lang, setLang } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [documentsText, setDocumentsText] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionTokens, setSessionTokens] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('session_id', sessionId);
    }
  }, []);

  useEffect(() => {
    const loadInitialTokens = async () => {
      try {
        const { data } = await supabase
            .from('token_usage')
            .select('total_tokens')
            .eq('id', 'global')
            .maybeSingle();
        if (data) setSessionTokens(data.total_tokens);
      } catch (error) {}
    };
    loadInitialTokens();
  }, []);

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPdf = async () => {
    if (!report || pdfLoading) return;
    setPdfLoading(true);
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: report, lang }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Legal_Analysis_Report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleStart = async () => {
    if (!userQuery) return;
    setLoading(true);
    setReport('');
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('documents', documentsText);
    formData.append('query', userQuery);
    formData.append('language', lang);
    formData.append('sessionId', localStorage.getItem('session_id') || '');

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });

      if (!res.ok) {
        const errorData = await res.json();
        setErrorMessage(errorData.error || "Unknown Error");
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataText = line.substring(6).trim();
              if (!dataText || dataText === '[DONE]') continue;
              const data = JSON.parse(dataText);
              if (data.choices?.[0]?.delta?.content) {
                fullText += data.choices[0].delta.content;
                setReport(fullText);
              } else if (data.tokens?.total) {
                setSessionTokens(prev => prev + data.tokens.total);
              }
            }
          }
        }
        window.dispatchEvent(new Event('history_updated'));
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
      <div className="flex flex-1 h-full bg-transparent overflow-hidden relative font-sans text-slate-900 dark:text-slate-100">
        {copied && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <CheckCircle size={12} />
              <span className="text-[10px] font-black uppercase">{t.copied}</span>
            </div>
        )}

        <div className={`fixed inset-0 z-50 lg:relative lg:inset-auto lg:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300`}>
          <Sidebar t={t} onSelect={(rep) => { setReport(rep); setIsSidebarOpen(false); setErrorMessage(null); }} />
          {isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 p-2 bg-white dark:bg-[#111114] rounded-full shadow-md text-slate-600"><X size={18} /></button>
          )}
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <div className="flex-1 overflow-hidden p-2 lg:p-4 flex flex-col items-center w-full">
            <div className="max-w-4xl w-full flex flex-col gap-2 h-full overflow-hidden">
              <header className="flex justify-between items-center bg-white dark:bg-[#111114] p-2 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm">
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsSidebarOpen(true)} className="p-1 lg:hidden text-slate-600 dark:text-slate-400"><Menu size={16} /></button>
                  <h1 className="text-[11px] lg:text-[13px] font-black uppercase tracking-tight">{t.brandName}</h1>
                  {sessionTokens > 0 && (
                      <span className="ml-2 flex items-center gap-1.5 text-[10px] lg:text-xs font-semibold tracking-tight text-slate-500 dark:text-slate-400">
                    <Coins className="w-3 h-3 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>{sessionTokens.toLocaleString()} used</span>
                  </span>
                  )}
                  {loading && <RobotIcon className="w-4 h-4 animate-spin text-indigo-500" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#1a1a20] border border-slate-200 dark:border-slate-700">
                    {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                  </button>
                  <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-slate-100 dark:bg-[#1a1a20] border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase outline-none cursor-pointer">
                    {['ru', 'uk'].map(l => (<option key={l} value={l}>{l === 'uk' ? 'UA' : l.toUpperCase()}</option>))}
                  </select>
                </div>
              </header>

              <div className="shrink-0">
                <InputSection files={files} setFiles={setFiles} setDocumentsText={setDocumentsText} userQuery={userQuery} setUserQuery={setUserQuery} loading={loading} onStart={handleStart} t={t} />
              </div>

              <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden mb-1 lg:mb-4">
                {errorMessage && (
                    <div className="shrink-0 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-start gap-2.5 animate-in fade-in zoom-in duration-300">
                      <AlertCircle className="text-amber-600 shrink-0 w-4 h-4" />
                      <div className="flex flex-col gap-0">
                        <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">System Notice</p>
                        <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-tight font-medium break-all">{errorMessage}</p>
                      </div>
                      <button onClick={() => setErrorMessage(null)} className="ml-auto p-0.5 text-amber-600"><X size={12} /></button>
                    </div>
                )}
                <div className="flex-1 min-h-0 relative">
                  <OutputArea
                      report={report}
                      loading={loading}
                      pdfLoading={pdfLoading}
                      scrollRef={scrollRef}
                      onCopy={handleCopy}
                      onDownloadPdf={handleDownloadPdf}
                      t={t}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}