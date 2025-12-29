'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sidebar } from '@/components/Sidebar';
import { InputSection } from '@/components/InputSection';
import { OutputArea } from '@/components/OutputArea';
import { Footer } from '@/components/Footer';
import { useTranslation } from '@/hooks/useTranslation';
import RobotIcon from '../components/RobotIcon';
import { Sun, Moon, CheckCircle, Menu, X, AlertCircle, Coins } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

export default function Home() {
  const { t, lang, setLang } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionTokens, setSessionTokens] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  // Load initial tokens from Supabase on mount
  useEffect(() => {
    const loadInitialTokens = async () => {
      try {
        const { data, error } = await supabase
          .from('token_usage')
          .select('total_tokens')
          .eq('id', 'global')
          .maybeSingle();
        setSessionTokens(data?.total_tokens ?? 0);
      } catch (error) {
        // Silently ignore DB load errors (RLS or connectivity issues)
      }
    };
    loadInitialTokens();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('token_usage')
          .upsert({
            id: 'global',
            total_tokens: sessionTokens,
          });
      } catch (error) {
        // Silently ignore DB save errors (RLS or connectivity issues)
      }
    }, 1000);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [sessionTokens]);

  const handleCopy = () => {
    if (!report) return;
    const cleanText = report.replace(/^#\s*COMPANY:.*$/m, '').replace(/Match Score:\s*\d+%/i, '').trim();
    navigator.clipboard.writeText(cleanText).then(() => {
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
        const metaMatch = report.match(/COMPANY:\s*(.*?)\s*\|\s*POSITION:\s*(.*)$/m);
        a.download = metaMatch ? `${metaMatch[1]}_${metaMatch[2]}.pdf`.replace(/\s+/g, '_') : 'Analysis_Report.pdf';
        document.body.appendChild(a);
        a.click();
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (e) { console.error(e); } finally { setPdfLoading(false); }
  };

  const handleStart = async () => {
    if (!resumeText || !jobUrl) return;
    setLoading(true);
    const startTokens = sessionTokens;
    setReport('');
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('resume', resumeText);
    formData.append('jobUrl', jobUrl);
    formData.append('language', lang);

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
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.replace('data: ', ''));
                if (data.choices[0]?.delta?.content) {
                  const content = data.choices[0].delta.content;
                  fullText += content;
                  setReport(fullText);
                  setSessionTokens((prev) => prev + Math.ceil(content.length / 4));
                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                  }
                } else if (data.tokens) {
                  let delta = 0;
                  if (data.tokens.total !== undefined) {
                    delta = data.tokens.total;
                  } else if (data.tokens.actor !== undefined) {
                    delta = data.tokens.actor;
                  }
                  setSessionTokens(startTokens + delta);
                }
              } catch (e) {}
            }
          }
        }

        const metaMatch = fullText.match(/COMPANY:\s*(.*?)\s*\|\s*POSITION:\s*(.*)$/m);
        const historyItem = {
          id: Date.now(),
          date: new Date().toLocaleString(),
          title: metaMatch ? `${metaMatch[1]} - ${metaMatch[2]}`.toUpperCase() : t.analysisReportTitle,
          url: jobUrl,
          report: fullText
        };
        const existing = JSON.parse(localStorage.getItem('analysis_history') || '[]');
        localStorage.setItem('analysis_history', JSON.stringify([historyItem, ...existing].slice(0, 20)));
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
      <div className="flex h-screen w-screen bg-slate-50 dark:bg-[#08080a] overflow-hidden relative font-sans text-slate-900 dark:text-slate-100">
        <div className={`fixed inset-0 z-50 lg:relative lg:inset-auto lg:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300`}>
          <Sidebar t={t} onSelect={(rep, url) => { setReport(rep); setJobUrl(url); setIsSidebarOpen(false); setErrorMessage(null); }} />
          {isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 p-2 bg-white dark:bg-[#111114] rounded-full shadow-md text-slate-600"><X size={18} /></button>
          )}
        </div>

        {copied && (
            <div className="fixed top-4 lg:top-16 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <CheckCircle size={12} />
              <span className="text-[10px] font-black uppercase">{t.copied}</span>
            </div>
        )}

        <main className="flex-1 h-screen flex flex-col overflow-hidden relative">
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
                <InputSection file={file} setFile={setFile} setResumeText={setResumeText} jobUrl={jobUrl} setJobUrl={setJobUrl} loading={loading} onStart={handleStart} t={t} />
              </div>

              <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden mb-1">
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
                <div className="flex-1 min-h-0 overflow-hidden rounded-b-2xl lg:rounded-b-3xl">
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
          <Footer />
        </main>
      </div>
  );
}