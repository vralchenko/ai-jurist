# AI Jurist ⚖️🤖

A professional tool designed to analyze legal situations and documents. The system uses AI to conduct a deep analysis based on Ukrainian legislation, identify legal risks, and provide actionable recommendations.

## 🚀 Key Features

* **Legal Analysis**: Deep analysis of user queries and legal documents (contracts, statements, lawsuits, etc.).
* **Ukrainian Law Focus**: Specialized knowledge base focusing exclusively on the current legislation of Ukraine.
* **Multi-document Support**: Upload multiple PDF documents (up to 5) for simultaneous analysis.
* **Risk Assessment**: Color-coded risk levels (Low/Medium/High) to quickly identify critical issues.
* **Actor-Critic AI Architecture**: Dual-stage AI processing for maximum accuracy and fact-checking.
* **PDF Export**: Save professional legal analysis reports as PDF documents.
* **Real-time Streaming**: Instant AI response visualization using Server-Sent Events (SSE).

## 🛠 Tech Stack

* **Frontend**: Next.js 16 (App Router), Turbopack, Tailwind CSS 4, Lucide React.
* **Backend**: Next.js API Routes.
* **AI Engine**: Groq API (Llama 3.3 70B models).
* **Database**: Supabase (PostgreSQL) for logging and token tracking.

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
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
AI_MODEL_NAME=llama-3.3-70b-versatile
```

### Local Development
1. `npm ci`
2. `npm run dev` (localhost:3000)
3. Build: `npm run build && npm start`

## Project Structure

- `src/app/api/analyze`: Logic for legal analysis and Groq API streaming.
- `src/app/api/pdf`: Service for generating A4 PDF documents from Markdown content.
- `src/components/InputSection`: Multi-file upload and AI query input.
- `src/components/OutputArea`: Real-time report visualization with Markdown support.
- `src/utils/prompts`: Refined system instructions for the AI jurist (Ukrainian law focus).

## 📊 Database Schema

### Table `analysis_logs`

```sql
CREATE TABLE IF NOT EXISTS analysis_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  job_url text, -- Kept for compatibility, stores query if needed
  job_raw_text text, -- Stores User Query
  resume_raw_text text, -- Stores combined Documents Text
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

## License

This project is licensed under the MIT License.

