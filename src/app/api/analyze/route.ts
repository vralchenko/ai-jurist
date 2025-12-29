import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { SYSTEM_PROMPT, USER_PROMPT, CRITIC_SYSTEM_PROMPT, CRITIC_USER_PROMPT } from '@/utils/prompts';
import crypto from 'crypto';
import { supabaseAdmin } from '@/utils/supabaseClient';
import geoip from 'fast-geoip';
import { isRateLimited } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

function parseUserAgent(raw: string) {
    const ua = raw.toLowerCase();
    let browser = 'Unknown', os = 'Unknown', device = 'Desktop';
    if (ua.includes('edg')) browser = 'Edge'; else if (ua.includes('chrome')) browser = 'Chrome'; else if (ua.includes('firefox')) browser = 'Firefox';
    if (ua.includes('win')) os = 'Windows'; else if (ua.includes('mac')) os = 'macOS'; else if (ua.includes('android')) os = 'Android';
    if (ua.includes('mobile')) device = 'Mobile';
    return { browser, os, device, raw };
}

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

        if (isRateLimited(ip)) {
            return new Response(JSON.stringify({ error: "Too many requests. Try again in a minute." }), { status: 429 });
        }

        const apiKey = process.env.GROQ_API_KEY;
        const groq = new Groq({ apiKey });
        const formData = await req.formData();

        const documentsText = formData.get('documents') as string || '';
        const userQuery = formData.get('query') as string || '';
        const language = formData.get('language') as string || 'uk';
        const sessionId = formData.get('sessionId') as string || crypto.randomUUID();

        const userAgent = req.headers.get('user-agent') || 'unknown';
        const geo = await geoip.lookup(ip);
        const model = process.env.AI_MODEL_NAME || 'llama-3.1-8b-instant';

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const actorRes = await groq.chat.completions.create({
                        model,
                        messages: [{ role: "system", content: SYSTEM_PROMPT() }, { role: "user", content: USER_PROMPT(documentsText, userQuery) }],
                        temperature: 0.3,
                    });

                    const draft = actorRes.choices[0]?.message?.content || "";
                    const actorTokens = actorRes.usage?.total_tokens ?? 0;

                    const criticStream = await groq.chat.completions.create({
                        model,
                        messages: [{ role: "system", content: CRITIC_SYSTEM_PROMPT() }, { role: "user", content: CRITIC_USER_PROMPT(documentsText, userQuery, draft) }],
                        temperature: 0.1,
                        stream: true,
                    });

                    let finalContent = "";
                    for await (const chunk of criticStream) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            finalContent += content;
                            controller.enqueue(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
                        }
                    }

                    if (supabaseAdmin) {
                        await supabaseAdmin.from('analysis_logs').insert([{
                            situation_query: userQuery,
                            documents_text: documentsText,
                            recommendations: finalContent,
                            tokens_total: actorTokens,
                            api_model: model,
                            ip_address: ip,
                            user_agent: { ...parseUserAgent(userAgent), country: geo?.country, city: geo?.city },
                            session_id: sessionId,
                            language
                        }]);
                    }
                    controller.enqueue("data: [DONE]\n\n");
                    controller.close();
                } catch (e) { controller.error(e); }
            },
        });
        return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}