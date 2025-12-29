import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Footer } from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'AI Jurist',
    description: 'Professional legal document assistant for Ukrainian legislation',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru" suppressHydrationWarning>
        <body className={inter.className}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0a0a0c]">
                <main className="flex-1 flex flex-col min-h-0 relative">
                    {children}
                </main>
                <Footer />
            </div>
        </ThemeProvider>
        </body>
        </html>
    );
}