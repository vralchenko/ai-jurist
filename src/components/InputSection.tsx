'use client';

import { useState } from 'react';
import { Upload, FileText, Sparkles, X, MessageSquare, Loader2 } from 'lucide-react';

interface InputSectionProps {
    files: File[];
    setFiles: (files: File[]) => void;
    setDocumentsText: (text: string) => void;
    userQuery: string;
    setUserQuery: (query: string) => void;
    loading: boolean;
    onStart: () => void;
    t: any;
}

export function InputSection({ files, setFiles, setDocumentsText, userQuery, setUserQuery, loading, onStart, t }: InputSectionProps) {
    const [isParsing, setIsParsing] = useState(false);

    const extractTextFromFile = async (file: File): Promise<string> => {
        if (typeof window === 'undefined') return '';
        const extension = file.name.split('.').pop()?.toLowerCase();

        try {
            if (extension === 'pdf') {
                const pdfjs = await import('pdfjs-dist');
                pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjs.getDocument({ data: arrayBuffer, useWorkerFetch: true, isEvalSupported: false });
                const pdf = await loadingTask.promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const strings = content.items.map((item: any) => item.str);
                    fullText += strings.join(' ') + '\n';
                }
                return fullText.replace(/\s+/g, ' ').trim();
            } 
            
            if (extension === 'docx') {
                const mammoth = await import('mammoth');
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                return result.value;
            }

            if (['png', 'jpg', 'jpeg', 'webp'].includes(extension || '')) {
                const { createWorker } = await import('tesseract.js');
                const worker = await createWorker('ukr+rus+eng');
                const { data: { text } } = await worker.recognize(file);
                await worker.terminate();
                return text;
            }

            if (['txt', 'md', 'rtf'].includes(extension || '')) {
                return await file.text();
            }

            return '';
        } catch (error) {
            console.error(`Error extracting text from ${extension}:`, error);
            return '';
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const newFiles = [...files, ...selectedFiles].slice(0, 5);
        setFiles(newFiles);
        
        setIsParsing(true);
        try {
            const texts = await Promise.all(newFiles.map(extractTextFromFile));
            setDocumentsText(texts.join('\n\n--- DOCUMENT BREAK ---\n\n'));
        } finally {
            setIsParsing(false);
        }
    };

    const removeFile = async (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        
        setIsParsing(true);
        try {
            const texts = await Promise.all(newFiles.map(extractTextFromFile));
            setDocumentsText(texts.join('\n\n--- DOCUMENT BREAK ---\n\n'));
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <section className="flex flex-col gap-3 w-full">
            <div className="relative w-full group overflow-hidden">
                <div className="absolute top-3 left-3 text-slate-400">
                    <MessageSquare size={16} />
                </div>
                <textarea
                    placeholder={t.queryPlaceholder}
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="w-full min-h-[120px] bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-lg lg:rounded-xl pl-10 pr-4 py-3 text-[12px] focus:ring-1 focus:ring-indigo-500 outline-none transition-all dark:text-white resize-none"
                />
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
                            <FileText size={12} />
                            <span className="truncate max-w-[150px]">{f.name}</span>
                            <button onClick={() => removeFile(i)} className="text-indigo-400 hover:text-rose-500 transition-colors">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    {files.length < 5 && (
                        <label className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:border-indigo-500 transition-all bg-white dark:bg-[#111114]">
                            <Upload size={12} className="text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.uploadDocs}</span>
                            <input type="file" className="hidden" accept=".pdf,.docx,.txt,.md,.rtf,.png,.jpg,.jpeg,.webp" multiple onChange={handleFileChange} />
                        </label>
                    )}
                </div>

                <button
                    onClick={onStart}
                    disabled={loading || isParsing || !userQuery}
                    className={`h-11 rounded-lg lg:rounded-xl font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center gap-2 transition-all ${loading || isParsing || !userQuery ? 'bg-slate-100 dark:bg-[#1a1a20] text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-95'}`}
                >
                    {isParsing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {loading ? t.analyzing : (isParsing ? t.readingFiles : t.analyzeNow)}
                </button>
            </div>
        </section>
    );
}