import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import {
    SYSTEM_PROMPT,
    USER_PROMPT,
    CRITIC_SYSTEM_PROMPT,
    CRITIC_USER_PROMPT
} from '@/utils/prompts';
import crypto from 'crypto';
import { supabaseAdmin } from '@/utils/supabaseClient';
import geoip from 'fast-geoip';

export const dynamic = 'force-dynamic';

function parseUserAgent(raw: string) {
    const ua = raw.toLowerCase();
    let browser = 'Unknown';
    if (ua.includes('edg') || ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';

    let os = 'Unknown';
    if (ua.includes('win')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    let device = 'Desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';
    else if (ua.includes('ipad') || ua.includes('tablet')) device = 'Tablet';

    return { browser, os, device, raw };
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 500 });

        const groq = new Groq({ apiKey });
        const formData = await req.formData();

        const documentsText = formData.get('documents') as string || '';
        const userQuery = formData.get('query') as string || '';
        const language = formData.get('language') as string || 'uk';
        const sessionId = formData.get('sessionId') as string || crypto.randomUUID();

        const userAgent = req.headers.get('user-agent') || 'unknown';
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

        const geo = await geoip.lookup(ip);
        const country = geo?.country || 'Unknown';
        const city = geo?.city || 'Unknown';
        const model = process.env.AI_MODEL_NAME || 'llama-3.1-8b-instant';

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const actorResponse = await groq.chat.completions.create({
                        model,
                        messages: [
                            { role: "system", content: SYSTEM_PROMPT() },
                            { role: "user", content: USER_PROMPT(documentsText, userQuery) }
                        ],
                        temperature: 0.3,
                    });

                    const draftAnalysis = actorResponse.choices[0]?.message?.content || "";
                    const actorTokens = actorResponse.usage?.total_tokens ?? 0;
                    controller.enqueue(`data: ${JSON.stringify({ tokens: { actor: actorTokens } })}\n\n`);

                    const criticStream = await groq.chat.completions.create({
                        model,
                        messages: [
                            { role: "system", content: CRITIC_SYSTEM_PROMPT() },
                            { role: "user", content: CRITIC_USER_PROMPT(documentsText, userQuery, draftAnalysis) }
                        ],
                        temperature: 0.1,
                        stream: true,
                    });

                    let finalRecommendations = "";
                    for await (const chunk of criticStream) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            finalRecommendations += content;
                            controller.enqueue(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
                        }
                    }

                    const finalUsageResponse = await groq.chat.completions.create({
                        model,
                        messages: [
                            { role: "system", content: CRITIC_SYSTEM_PROMPT() },
                            { role: "user", content: CRITIC_USER_PROMPT(documentsText, userQuery, draftAnalysis) }
                        ],
                        temperature: 0.1,
                    });

                    const criticTokens = finalUsageResponse.usage?.total_tokens ?? 0;
                    const totalTokens = actorTokens + criticTokens;

                    if (supabaseAdmin) {
                        const { error } = await supabaseAdmin.from('analysis_logs').insert([{
                            situation_query: userQuery,
                            documents_text: documentsText,
                            recommendations: finalRecommendations,
                            tokens_actor: actorTokens,
                            tokens_critic: criticTokens,
                            tokens_total: totalTokens,
                            api_provider: 'Groq',
                            api_model: model,
                            ip_address: ip,
                            user_agent: { ...parseUserAgent(userAgent), country, city },
                            session_id: sessionId,
                            language: language
                        }]);

                        if (error) console.error('Supabase Insert Error:', error);
                    }

                    controller.enqueue(`data: ${JSON.stringify({ tokens: { actor: actorTokens, critic: criticTokens, total: totalTokens } })}\n\n`);
                    controller.enqueue("data: [DONE]\n\n");
                    controller.close();
                } catch (e: any) {
                    controller.error(e);
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error: any) {
        const msg = error.message || "Internal Error";
        return new Response(JSON.stringify({ error: msg }), { status: 500 });
    }
}