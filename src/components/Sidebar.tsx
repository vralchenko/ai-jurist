'use client';

import { useState, useEffect } from 'react';
import { History, Trash2, Clock, X, Loader2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { supabase } from '@/utils/supabaseClient';

interface SidebarProps {
    t: any;
    onSelect: (report: string) => void;
}

export function Sidebar({ t, onSelect }: SidebarProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const loadHistory = async () => {
        const sessionId = localStorage.getItem('session_id');
        if (!sessionId) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('analysis_logs')
                .select('id, created_at, situation_query, recommendations')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching history:', error.message);
            } else if (data) {
                setHistory(data.map(item => ({
                    id: item.id,
                    date: new Date(item.created_at).toLocaleString(),
                    title: item.situation_query.toUpperCase(),
                    report: item.recommendations
                })));
            }
        } catch (e) {
            console.error('Fetch exception:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
        window.addEventListener('history_updated', loadHistory);
        return () => window.removeEventListener('history_updated', loadHistory);
    }, []);

    const handleClearAll = async () => {
        const sessionId = localStorage.getItem('session_id');
        if (!sessionId) return;

        const { error } = await supabase
            .from('analysis_logs')
            .delete()
            .eq('session_id', sessionId);

        if (!error) {
            setHistory([]);
            setIsModalOpen(false);
        }
    };

    const deleteItem = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const { error } = await supabase
            .from('analysis_logs')
            .delete()
            .eq('id', id);

        if (!error) {
            setHistory(prev => prev.filter(item => item.id !== id));
        }
    };

    return (
        <aside className="w-full sm:w-[320px] lg:w-[380px] h-full bg-white dark:bg-[#111114] flex flex-col">
            <div className="p-6 flex justify-between items-center">
                <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                    <History size={20} />
                    <h2 className="text-sm font-black uppercase tracking-widest">{t.history}</h2>
                </div>
                {isLoading ? (
                    <Loader2 size={16} className="animate-spin text-slate-400" />
                ) : history.length > 0 && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-2 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-4">
                {history.length === 0 && !isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                        <Clock size={32} strokeWidth={1} />
                        <p className="text-[10px] font-bold uppercase mt-2">{t.noHistory}</p>
                    </div>
                ) : (
                    history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item.report)}
                            className="group relative p-5 rounded-3xl bg-slate-50 dark:bg-[#1a1a20] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#22222a] transition-all"
                        >
                            <button
                                onClick={(e) => deleteItem(e, item.id)}
                                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-slate-400">{item.date}</span>
                                <h3 className="text-[13px] font-black text-slate-900 dark:text-white leading-tight uppercase">
                                    {item.title}
                                </h3>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleClearAll}
                title={t.clearHistoryTitle}
                message={t.clearHistoryMessage}
                t={t}
            />
        </aside>
    );
}