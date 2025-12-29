import { NextRequest } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { isRateLimited } from '@/utils/rateLimit';

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

        if (isRateLimited(ip)) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { text, title = "Legal Analysis" } = await req.json();

        if (!text) {
            return new Response("Error: No content provided", { status: 400 });
        }

        const lines = text.split('\n');
        const children = lines.map((line: string) => {
            if (line.startsWith('### ')) {
                return new Paragraph({
                    text: line.replace('### ', '').trim(),
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 400, after: 200 },
                });
            }
            if (line.startsWith('## ')) {
                return new Paragraph({
                    text: line.replace('## ', '').trim(),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 200 },
                });
            }
            return new Paragraph({
                children: [new TextRun({ text: line, size: 24 })],
                spacing: { after: 150 },
            });
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: title.toUpperCase(),
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),
                    ...children,
                ],
            }],
        });

        const buffer = await Packer.toBuffer(doc);
        
        const uint8Array = new Uint8Array(buffer);

        return new Response(uint8Array, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="Legal_Report.docx"`,
            },
        });
    } catch (error: any) {
        console.error('DOCX Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}