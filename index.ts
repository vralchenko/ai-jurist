import { Ollama } from 'ollama';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'module';
import puppeteer from 'puppeteer';

// Setup for CommonJS compatibility with pdf-parse-fork
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse-fork');

// Configuration from .env
const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });
const model = process.env.OLLAMA_MODEL || 'llama3.1:8b';

/**
 * Extracts text content from a PDF file
 */
async function readPdf(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
        console.error(`File missing: ${filePath}`);
        return "";
    }
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        console.error(`Error parsing PDF at ${filePath}:`, error);
        return "";
    }
}

/**
 * Scrapes job description from a URL (LinkedIn, SwissDevJobs, etc.)
 */
async function scrapeJob(url: string): Promise<string> {
    console.log(`🌐 Scraping job from: ${url}...`);
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Set User-Agent to avoid basic bot detection
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Selectors for different job boards
        let selector = 'body';
        if (url.includes('linkedin.com')) selector = '.description__text, .show-more-less-html__markup';
        if (url.includes('swissdevjobs.ch')) selector = '.job-description';

        await page.waitForSelector(selector, { timeout: 10000 }).catch(() => null);

        const text = await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            return el ? (el as HTMLElement).innerText : document.body.innerText;
        }, selector);

        await browser.close();
        return text.trim();
    } catch (error) {
        console.error("Scraping failed:", error);
        await browser.close();
        return "";
    }
}

/**
 * Saves the analysis report to the /reports folder
 */
function saveReport(content: string) {
    const reportsDir = './reports';
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filePath = path.join(reportsDir, `analysis_${timestamp}.md`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\n💾 Report saved to: ${filePath}`);
}

/**
 * Main Analysis Orchestrator
 */
async function runAnalysis(resumePath: string, jobSource: string) {
    console.log("🚀 Starting Process...");

    // Get Resume Text
    const resumeText = await readPdf(resumePath);

    // Get Job Text (from URL or PDF)
    let jobText = "";
    if (jobSource.startsWith('http')) {
        jobText = await scrapeJob(jobSource);
    } else {
        jobText = await readPdf(jobSource);
    }

    if (!resumeText || !jobText) {
        console.error("❌ Failed to extract text from sources.");
        return;
    }

    console.log(`🧠 Analyzing with ${model} on M4 Pro...`);

    const prompt = `
        Context: Professional Jurist.
        Task: Analyze the Resume against the Job Description (JD).
        
        Output Requirements (Language: Russian):
        1. Match Percentage (0-100%).
        2. Gap Analysis (Missing skills).
        3. 5 Interview Questions (In the language of the JD: English or German).
        4. Senior-level Answers (In Russian, based on candidate's experience).

        RESUME:
        ${resumeText}

        JOB DESCRIPTION:
        ${jobText}
    `;

    try {
        const response = await ollama.chat({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            stream: true
        });

        let fullContent = "";
        console.log("\n--- REPORT ---");
        for await (const part of response) {
            process.stdout.write(part.message.content);
            fullContent += part.message.content;
        }

        saveReport(fullContent);
    } catch (error) {
        console.error("Ollama Analysis Error:", error);
    }
}

// EXAMPLE USAGE:
// You can pass a PDF path or a URL as the second argument
runAnalysis('./data/resume.pdf', 'https://www.linkedin.com/jobs/view/4345863493/?alternateChannel=search&eBP=NOT_ELIGIBLE_FOR_CHARGING&trk=d_flagship3_search_srp_jobs&refId=ZFU1ojIQyOooM1RUO7elpw%3D%3D&trackingId=IHgW7LKxGrLShZkRvA%2BvYQ%3D%3D');
