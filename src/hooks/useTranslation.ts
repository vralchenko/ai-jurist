import { useState, useEffect } from 'react';
import ru from '@/locales/ru.json';
import uk from '@/locales/uk.json';

const translations: Record<string, any> = { ru, uk };

export function useTranslation() {
    const [lang, setLang] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('app_lang') || 'ru';
        }
        return 'ru';
    });

    useEffect(() => {
        const handleLangChange = (e: any) => {
            setLang(e.detail);
        };
        window.addEventListener('lang_update', handleLangChange);
        return () => window.removeEventListener('lang_update', handleLangChange);
    }, []);

    const updateLang = (newLang: string) => {
        localStorage.setItem('app_lang', newLang);
        setLang(newLang);
        window.dispatchEvent(new CustomEvent('lang_update', { detail: newLang }));
    };

    const t = translations[lang] || translations['en'];

    return { t, lang, setLang: updateLang };
}