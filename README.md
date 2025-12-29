# AI Jurist ⚖️🤖

A professional tool designed to analyze legal documents and resumes. The system uses AI to conduct a deep comparison of skills, identify critical gaps, and prepare candidates for legal interviews.

## 🚀 Key Features

* **Smart Analysis**: Compares PDF resumes with job descriptions or legal requirements directly from a URL.
* **Interview Roadmap**: Automatically generates 5 technical/legal questions based on identified gaps with expected answers.
* **Multi-language Support**: Support for Russian and Ukrainian.
* **PDF Export**: Save a beautifully formatted analysis report with color-coded sections.
* **Real-time Streaming**: Optimized SSE processing with buffering to ensure smooth AI response visualization.

## 🛠 Tech Stack

* **Frontend**: Next.js 16 (App Router), Turbopack, Tailwind CSS 4, Lucide React.
* **Backend**: Next.js API Routes, Puppeteer (for job scraping and PDF generation).
* **AI Engine**: Groq API (Llama 3.1 8B / 70B models).
* **Deployment**: Render (Docker Runtime).

## ⚙️ Setup and Installation

### Prerequisites
- Node.js 20+
- Groq API key from https://console.groq.com/keys

### Environment Variables
Create a `.env` file in the root directory:

```env
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # Server-side logging (Supabase Settings > API > service_role)
AI_MODEL_NAME=llama-3.3-70b-versatile  # default Groq model
```

### Local Development
1. `npm ci`
2. `npm run dev` (localhost:3000)
3. Build: `npm run build && npm start`
- Prerequisites and `.env` setup in previous sections.

## Docker Deployment

1. **Service Creation**  
   Select **Docker** as the Runtime when creating a New Web Service on [Render](https://render.com).

**Environment Variables**
    - `GROQ_API_KEY`: Your production API key
    - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
    - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (Settings > API > service_role)
    - `PUPPETEER_EXECUTABLE_PATH`: `/usr/bin/google-chrome-stable`
    - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: `true`

## 🗄️ Supabase Setup

### Prerequisites
- Create free project at [supabase.com/dashboard](https://supabase.com/dashboard)

### 1. Create Table `token_usage`
Run in SQL Editor:
```sql
CREATE TABLE IF NOT EXISTS token_usage (
  id text PRIMARY KEY DEFAULT 'global',
  total_tokens bigint DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
```

### 2. Row Level Security (RLS)
- Enable RLS on table `token_usage`.
- Create policies for anon/public (demo only):
  | Operation | Expression | Roles |
  |-----------|------------|-------|
  | SELECT    | `true`     | anon  |
  | INSERT    | `true`     | anon  |
  | UPDATE    | `true`     | anon  |

**Production**: Use `auth.uid()::text = id` after adding auth.

### 3. Copy Env Vars
From project Settings > API:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Analysis Logs DB Setup

### Create Table `analysis_logs`

Run in SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS analysis_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  job_url text,
  job_raw_text text,
  resume_raw_text text,
  recommendations text,
  tokens_actor integer DEFAULT 0,
  tokens_critic integer DEFAULT 0,
  tokens_total integer DEFAULT 0,
  api_provider text DEFAULT 'Groq',
  api_model text,
  user_agent jsonb,
  session_id text
);
```

### RLS (Optional)

Service role bypasses RLS. Enable RLS on the table if additional security is needed.

## Project Structure

- `src/app/api/analyze`: Logic for resume parsing and Groq API streaming.
- `src/app/api/pdf`: Service for generating A4 PDF documents from Markdown content.
- `src/components/OutputArea`: Real-time report visualization with Markdown support.
- `src/utils/prompts`: Refined system instructions for the AI jurist.

## Additional Development Information

### Code Style & Linting
- ESLint 9 (flat config): `npm run lint`
- Tailwind CSS 4 (Oxide engine): `@tailwindcss/postcss`
- TypeScript 5, strict mode

### Frameworks & Plugins
- **React 19 + Compiler**: `babel-plugin-react-compiler` (optimizes without memos)
- **Next.js 16 App Router**
- **Dark Mode**: `next-themes`
- **Icons**: `lucide-react`
- **Markdown**: `react-markdown` + `remark-gfm`

### Key Implementation Details
- **Analysis**: URL scrape (Puppeteer) → Resume parse (pdfjs-dist) → AI (Groq/Ollama) → SSE
- **Prompts**: `src/utils/prompts.ts`
- **History**: localStorage, custom events
- **Export**: `html-to-image` + `jsPDF`
- **i18n**: Manual `t` prop (translation objects)

### Debugging Tips
- Puppeteer: `headless: false`
- Ollama: `ollama serve & ollama pull llama3.1-8b-instruct`
- Logs: console in dev

## License

This project is licensed under the MIT License.

