# AI Debate Arena - Distribution Version

## Quick Start

### Windows
Double-click `start.bat` to launch the application

### Or manually
```bash
npm run start
```
Then open http://localhost:3000 in your browser

## Usage

1. **Add Debaters**: Click "Add Debater" to configure pro and con sides
2. **Set Topic**: Enter your debate topic at the top
3. **Start Debate**: Click "Start Debate"

### Debater Configuration
- Select a model for each debater (e.g., gpt-4o-mini, qwen-plus, deepseek-chat)
- Enter the corresponding API Key
- Optionally enable "Thinking Mode" for better reasoning

### 2-Person vs 8-Person Format
- **2-Person**: Each side speaks 10 turns, then judge gives verdict
- **8-Person**: Complete debate format (opening, cross-examination, free debate, closing)

## Tech Stack
- Next.js 16
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Notes
- First launch may take a few seconds to initialize
- API Keys are stored in browser locally, never uploaded
- If issues occur, try `npm run dev` for development mode
