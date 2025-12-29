'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, FileDown, Loader2, BarChart3 } from 'lucide-react';

interface OutputAreaProps {
    report: string;
    loading: boolean;
    pdfLoading: boolean;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    onCopy: () => void;
    onDownloadPdf: () => void;
    t: any;
}

export function OutputArea({ report, loading, pdfLoading, scrollRef, onCopy, onDownloadPdf, t }: OutputAreaProps) {
    if (!loading && !report) return null;

    return (
        <div className="bg-white dark:bg-[#111114] rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full w-full">
            <div className="p-3 lg:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 dark:bg-white/5 shrink-0">
                <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-indigo-500" />
                    <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-slate-500">
                        {t.analysisReportTitle}
                    </h2>
                </div>

                {report && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={onCopy}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-white dark:bg-[#1a1a20] border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all dark:text-white"
                        >
                            <Copy size={14} />
                            <span>{t.copyReport}</span>
                        </button>
                        <button
                            onClick={onDownloadPdf}
                            disabled={pdfLoading}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/10 disabled:opacity-70"
                        >
                            {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                            <span>{pdfLoading ? t.loading : t.downloadPdf}</span>
                        </button>
                    </div>
                )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar pb-32">
                {loading && !report ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                        <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] animate-pulse">
                            {t.initializingAI}
                        </p>
                    </div>
                ) : (
                    <div className="
            prose prose-slate dark:prose-invert max-w-none 
            prose-headings:font-black prose-headings:text-slate-900 dark:prose-headings:text-white prose-headings:uppercase
            prose-strong:font-bold prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400
            animate-in fade-in duration-700
          ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {report}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}