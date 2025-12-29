import puppeteer from 'puppeteer';
import { marked } from 'marked';

export async function POST(req: Request) {
    let browser;
    try {
        const { html: markdownText, lang = 'en' } = await req.json();

        if (!markdownText || markdownText.trim() === "" || markdownText === "undefined") {
            return new Response("Error: Content is empty", { status: 400 });
        }

        const contentHtml = marked.parse(markdownText);

        const finalHtml = `
            <!DOCTYPE html>
            <html lang="${lang}">
            <head>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                    body { 
                        font-family: 'Inter', 'Noto Color Emoji', 'Segoe UI Emoji', sans-serif; 
                        color: #1e293b; 
                        line-height: 1.6; 
                    }
                    h1 { color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 24px; font-weight: 900; }
                    h2 { color: #4f46e5; margin-top: 20px; font-weight: 700; }
                    
                    ul { 
                        list-style-type: none; 
                        padding-left: 0; 
                        margin-bottom: 16px; 
                    }
                    ul li { 
                        margin-bottom: 8px; 
                        position: relative; 
                        padding-left: 25px; 
                    }
                    ul li::before { 
                        content: "•"; 
                        color: #6366f1; 
                        position: absolute; 
                        left: 0; 
                        font-weight: bold;
                        font-size: 1.2em;
                    }

                    ol { 
                        padding-left: 25px; 
                        margin-bottom: 16px;
                        color: #1e293b;
                    }
                    ol li { 
                        margin-bottom: 12px;
                        padding-left: 5px;
                    }
                    ol li::before {
                        content: none;
                    }
                    
                    strong { color: #0f172a; font-weight: 700; }
                    p { margin-bottom: 12px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                    th { background-color: #f8fafc; }
                </style>
            </head>
            <body class="p-10 bg-white">
                <div class="max-w-4xl mx-auto">
                    ${contentHtml}
                </div>
            </body>
            </html>
        `;

        browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process',
                '--no-zygote',
                '--font-render-hinting=none'
            ]
        });

        const page = await browser.newPage();
        await page.setContent(finalHtml, {
            waitUntil: ['domcontentloaded', 'networkidle0'],
            timeout: 30000
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });

        return new Response(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="analysis.pdf"'
            }
        });
    } catch (e: any) {
        console.error('PDF Generation Error:', e);
        return new Response(`PDF Error: ${e.message}`, { status: 500 });
    } finally {
        if (browser) await browser.close();
    }
}