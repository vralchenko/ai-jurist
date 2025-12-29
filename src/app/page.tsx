'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sidebar } from '@/components/Sidebar';
import { InputSection } from '@/components/InputSection';
import { OutputArea } from '@/components/OutputArea';
import { useTranslation } from '@/hooks/useTranslation';
import { Sun, Moon, Menu, X, AlertCircle, CheckCircle } from 'lucide-react';

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
  const [docxLoading, setDocxLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem('session_id')) {
      localStorage.setItem('session_id', crypto.randomUUID());
    }
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
    setErrorMessage(null);
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: report, lang }),
      });
      if (res.status === 429) {
        setErrorMessage("Занадто багато запитів. Зачекайте хвилину.");
        return;
      }
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Legal_Analysis_${new Date().getTime()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!report || docxLoading) return;
    setDocxLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: report, title: "Юридичний аналіз" }),
      });
      if (res.status === 429) {
        setErrorMessage("Занадто багато запитів. Зачекайте хвилину.");
        return;
      }
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Legal_Report_${new Date().getTime()}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDocxLoading(false);
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
      if (res.status === 429) {
        setErrorMessage("Rate limit exceeded. Please wait a minute.");
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
              try {
                const data = JSON.parse(dataText);
                if (data.choices?.[0]?.delta?.content) {
                  fullText += data.choices[0].delta.content;
                  setReport(fullText);
                }
              } catch (e) {}
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
        </div>
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <div className="flex-1 overflow-hidden p-2 lg:p-4 flex flex-col items-center w-full">
            <div className="max-w-4xl w-full flex flex-col gap-2 h-full overflow-hidden">
              <header className="flex justify-between items-center bg-white dark:bg-[#111114] p-2 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm">
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsSidebarOpen(true)} className="p-1 lg:hidden"><Menu size={16} /></button>
                  <h1 className="text-[11px] lg:text-[13px] font-black uppercase tracking-tight">{t.brandName}</h1>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                  </button>
                  <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-slate-100 dark:bg-[#1a1a20] border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase outline-none">
                    {['ru', 'uk'].map(l => (<option key={l} value={l}>{l === 'uk' ? 'UA' : l.toUpperCase()}</option>))}
                  </select>
                </div>
              </header>
              <div className="shrink-0">
                <InputSection files={files} setFiles={setFiles} setDocumentsText={setDocumentsText} userQuery={userQuery} setUserQuery={setUserQuery} loading={loading} onStart={handleStart} t={t} />
              </div>
              <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden mb-1 lg:mb-4">
                {errorMessage && (
                    <div className="shrink-0 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-start gap-2.5">
                      <AlertCircle className="text-amber-600 shrink-0 w-4 h-4" />
                      <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-tight">{errorMessage}</p>
                      <button onClick={() => setErrorMessage(null)} className="ml-auto text-amber-600"><X size={12} /></button>
                    </div>
                )}
                <div className="flex-1 min-h-0 relative">
                  <OutputArea
                      report={report}
                      loading={loading}
                      pdfLoading={pdfLoading}
                      docxLoading={docxLoading}
                      scrollRef={scrollRef}
                      onCopy={handleCopy}
                      onDownloadPdf={handleDownloadPdf}
                      onDownloadDocx={handleDownloadDocx}
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