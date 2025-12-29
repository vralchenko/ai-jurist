# 🚀 Project Master Guidelines

## ⚠️ Critical Constraints & Rules

### 1. Code Preservation & Refactoring
- **Never delete** existing functions, utility logic, or components unless explicitly requested for a complete rewrite.
- Before modifying a file, **scan for dependencies** to ensure that removing or renaming a variable won't break other components (e.g., ensuring `Actor-Critic` prompts stay linked).
- If a task is ambiguous, **ask for clarification** in "Ask Mode" before applying changes in "Code Mode".

### 2. Language & Localization
- **English Only**: All code comments, JSDoc, console logs, and commit messages must be in **English ONLY**.
- **No Russian comments**: If you find existing Russian comments, you may translate them to English, but never add new ones.
- **UI Translations**: Maintain the existing i18n structure using the `t` prop and translation objects. Do not hardcode strings in components.

### 3. AI Architecture (Actor-Critic)
- Always respect the **Actor-Critic pattern** established in `src/app/api/analyze/route.ts` and `src/utils/prompts.ts`.
- The Critic stage must always verify the presence of the `[USER_PHOTO_HERE]` placeholder and exact contact details (e.g., email `vr@r-al.ch`).
- **No Markdown Tables**: AI responses for Match Scores must use bullet points and headers only to ensure mobile responsiveness.

### 4. Code Style & UI
- Maintain **Tailwind CSS 4** utility-first approach (Oxide engine).
- Use **Lucide React** for icons and follow the minimalist, dark-themed UI aesthetic.
- Ensure `sessionTokens` are tracked and displayed in the Header in real-time.

### 🚫 Build & Environment Restrictions
- **No .NET/MSBuild**: This is a pure Node.js/Next.js project. Ignore all MSBuild or Solution file errors. Never attempt to use `dotnet build` or `msbuild`.
- **Package Management**: Always use `npm` for installing dependencies and running scripts.
- **Primary Scripts**:
    - `npm ci`: Clean installation of dependencies.
    - `npm run dev`: Local development.
    - `npm run build`: Production builds.
- **Fix all ts errors**: like 'throw' of exception caught locally.

## 📊 Database & Logging (Supabase)
- **Provider**: Supabase (PostgreSQL).
- **Logging Table**: `analysis_logs`.
- **Target Data**: Capture raw job text, raw resume text, final recommendations, token usage (actor/critic), and system metadata (browser/OS/date).
- **Execution**: Database insertion must be asynchronous and must not block the main SSE stream.

## ⚙️ Development Information

### Prerequisites
- Node.js 20+
- Groq API key (configured in `.env`).

### Frameworks & Plugins
- **React 19 + Compiler**: `babel-plugin-react-compiler`.
- **Next.js 16 App Router**.
- **Dark Mode**: `next-themes`.
- **Markdown**: `react-markdown` + `remark-gfm`.

### Key Implementation Details
- **Analysis**: URL scrape (Puppeteer) → Resume parse (pdfjs-dist) → AI (Groq/Ollama) → SSE.
- **History**: `localStorage` with custom event synchronization.
- **Export**: `html-to-image` + `jsPDF` for resume generation.

### Testing Status
- **Current Setup**: No unit/E2E test runner is currently active. Avoid adding complex test suites unless requested.

### Debugging Tips
- Puppeteer: Set `headless: false` for visual debugging.
- Logs: Use standard English `console.log` for server-side and client-side debugging.