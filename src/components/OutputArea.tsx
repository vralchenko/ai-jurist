import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, FileDown, FileText, Loader2 } from 'lucide-react';

interface OutputAreaProps {
    report: string;
    loading: boolean;
    pdfLoading: boolean;
    docxLoading: boolean;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    onCopy: () => void;
    onDownloadPdf: () => void;
    onDownloadDocx: () => void;
    t: any;
}

export const OutputArea: React.FC<OutputAreaProps> = ({
                                                          report,
                                                          loading,
                                                          pdfLoading,
                                                          docxLoading,
                                                          scrollRef,
                                                          onCopy,
                                                          onDownloadPdf,
                                                          onDownloadDocx,
                                                          t
                                                      }) => {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-3 border-bottom border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#16161a]">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t.analysisResult}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onCopy}
                        disabled={!report}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1a1a20] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        <Copy size={14} />
                        <span className="text-[10px] font-bold uppercase">{t.copy}</span>
                    </button>
                    <button
                        onClick={onDownloadDocx}
                        disabled={!report || docxLoading}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {docxLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                        <span className="text-[10px] font-bold uppercase">DOCX</span>
                    </button>
                    <button
                        onClick={onDownloadPdf}
                        disabled={!report || pdfLoading}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                        <span className="text-[10px] font-bold uppercase">PDF</span>
                    </button>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 prose prose-slate dark:prose-invert max-w-none prose-sm lg:prose-base">
                {loading && !report ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                        <Loader2 className="animate-spin" size={32} />
                        <p className="text-xs font-medium animate-pulse uppercase tracking-widest">{t.processing}</p>
                    </div>
                ) : report ? (
                    <ReactMarkdown>{report}</ReactMarkdown>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-700">
                        <FileText size={48} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-widest mt-4">{t.waitingForInput}</p>
                    </div>
                )}
            </div>
        </div>
    );
};