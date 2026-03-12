'use client';

import React from 'react';

export const Footer = () => {
    return (
        <footer className="w-full py-2 px-4 border-t border-slate-100 dark:border-slate-800/30 bg-white dark:bg-[#08080a] shrink-0">
            <div className="w-full text-center space-y-1">
                <p className="text-[9px] lg:text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-[0.2em]">
                    © 2026 Viktor Ralchenko
                </p>
                <div className="flex justify-center gap-3">
                    <a href="mailto:vralchenko@gmail.com" className="text-[9px] lg:text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">vralchenko@gmail.com</a>
                    <a href="https://www.linkedin.com/in/victoralchenko/" target="_blank" rel="noopener noreferrer" className="text-[9px] lg:text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">LinkedIn</a>
                    <a href="https://vralchenko-portfolio.vercel.app/en" target="_blank" rel="noopener noreferrer" className="text-[9px] lg:text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Portfolio</a>
                </div>
            </div>
        </footer>
    );
};