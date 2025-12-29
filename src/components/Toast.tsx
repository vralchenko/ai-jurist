'use client';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    visible: boolean;
}

export default function Toast({ message, type, visible }: ToastProps) {
    return (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
            <div className={`backdrop-blur-xl border px-6 py-2 rounded-2xl flex items-center gap-3 shadow-2xl ${type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm font-bold tracking-tight">{message}</span>
            </div>
        </div>
    );
}