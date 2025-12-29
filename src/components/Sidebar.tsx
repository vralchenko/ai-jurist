'use client';

import { useState, useEffect } from 'react';
import { History, Trash2, ExternalLink, Clock, X } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface SidebarProps {
    t: any;
    onSelect: (report: string) => void;
}

export function Sidebar({ t, onSelect }: SidebarProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadHistory = () => {
        const data = JSON.parse(localStorage.getItem('analysis_history') || '[]');
        setHistory(data);
    };

    useEffect(() => {
        loadHistory();
        window.addEventListener('history_updated', loadHistory);
        return () => window.removeEventListener('history_updated', loadHistory);
    }, []);

    const handleClearAll = () => {
        localStorage.removeItem('analysis_history');
        setHistory([]);
    };

    const deleteItem = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const updated = history.filter(item => item.id !== id);
        localStorage.setItem('analysis_history', JSON.stringify(updated));
        setHistory(updated);
    };

    return (
        <>
            <aside className="w-full sm:w-[320px] lg:w-[380px] h-full bg-white dark:bg-[#111114] border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl lg:shadow-none relative">
                <div className="p-5 lg:p-7 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-white/5">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <History size={20} />
                        <h2 className="text-sm font-black uppercase tracking-[0.15em] leading-none">
                            {t.history}
                        </h2>
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-[11px] font-black uppercase text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-100 dark:border-rose-500/20"
                        >
                            <Trash2 size={14} />
                            {t.clear}
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                            <Clock size={32} strokeWidth={1} />
                            <p className="text-[10px] font-bold uppercase tracking-widest">{t.noHistory}</p>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => onSelect(item.report)}
                                className="group relative p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-slate-50 dark:bg-[#1a1a20] border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all cursor-pointer shadow-xs"
                            >
                                <button
                                    onClick={(e) => deleteItem(e, item.id)}
                                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 lg:opacity-0 lg:group-hover:opacity-100 transition-all bg-white dark:bg-[#111114] rounded-full shadow-sm"
                                >
                                    <X size={14} />
                                </button>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.date}</span>
                                    <h3 className="text-[11px] lg:text-xs font-black text-slate-900 dark:text-white leading-tight line-clamp-2 pr-6 uppercase tracking-tight">
                                        {item.title}
                                    </h3>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleClearAll}
                title={t.clearHistoryTitle || "Clear History"}
                message={t.clearHistoryMessage || "This will permanently delete all your analysis records. Are you sure?"}
                t={t}
            />
        </>
    );
}