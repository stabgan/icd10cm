# ICD-10-CM Browser

A modern web app for searching and browsing ICD-10-CM medical diagnosis codes.

## What It Does

The ICD-10-CM Browser lets healthcare professionals, medical coders, and students look up diagnosis codes from the ICD-10-CM classification system. Upload a JSONL data file, and the app indexes it into MongoDB for fast full-text search, alphabetical browsing, and detailed code views — all in a responsive, dark/light themed UI with a 50/50 split layout (sidebar + detail panel).

Key features:

- Real-time search with debounced queries and text-score ranking
- Alphabetical sidebar navigation by code prefix
- Detailed code view with markdown-rendered context
- PDF export of code details
- Dark/light mode with system preference detection
- JSONL file upload with SSE-based progress tracking
- Database reset and reload from last uploaded file

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Tailwind CSS 3 |
| Backend | Node.js, Express 4 |
| Database | MongoDB (via native driver) |
| Build | Vite 5 |
| Other | Multer (file uploads), jsPDF (PDF export), FlexSearch, react-markdown |

## Prerequisites

- Node.js >= 14
- MongoDB >= 4.0 (running on `localhost:27017`)
- npm

## Getting Started

```bash
git clone https://github.com/stabgan/icd10cm.git
cd icd10cm
npm install
```

### Development

```bash
# Start both frontend (port 3000) and backend (port 5000)
npm run dev:all

# Or separately
npm run server   # Express API
npm run dev      # Vite dev server
```

### Production

```bash
npm run start    # Builds frontend, then serves everything on port 5000
```

### First Run

On first launch, the app shows a splash screen. Upload a JSONL file where each line is:

```json
{"code": "A00.0", "description": "Cholera due to Vibrio cholerae 01, biovar cholerae", "detailed_context": "Markdown-formatted details..."}
```

The server processes the file in the background and streams progress via SSE.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/process-file` | Upload and process a JSONL data file |
| GET | `/api/processing-status` | SSE stream of import progress |
| GET | `/api/check-data` | Check if data is loaded |
| GET | `/api/code-index` | Get index metadata (total codes, letter map) |
| GET | `/api/search?q=` | Search codes by text or code prefix |
| GET | `/api/code/:id` | Get a single code by ID |
| GET | `/api/codes/:letter` | Get all codes starting with a letter |
| POST | `/api/reset-database` | Drop all data and re-import from last file |

## Project Structure

```
├── server.js              # Express API + MongoDB integration
├── start.js               # Dev launcher (checks MongoDB, starts both servers)
├── check-mongodb.js       # MongoDB connectivity check script
├── vite.config.js         # Vite config with proxy to backend
├── tailwind.config.js     # Custom medical-themed color palette
├── src/
│   ├── App.jsx            # Root component, routing, 50/50 layout
│   ├── main.jsx           # React entry point
│   ├── components/        # UI components (Search, CodeSidebar, Header, etc.)
│   ├── contexts/          # ThemeContext (dark/light mode)
│   ├── pages/             # Route-level page components
│   └── utils/             # API service layer
└── scripts/               # Build scripts (Electron, data processing)
```

## Known Issues

- `apiService.js` hardcodes `http://localhost:5000/api` — the Vite proxy handles this in dev, but the hardcoded URL will break if the backend runs on a different host/port in production.
- The `vite.config.js` uses `require.resolve('terser')` inside an ES module, which throws at build time (caught silently, falls back to esbuild).
- The CI workflow (`test.yml`) references `npm test` and Playwright, but neither `vitest`/`jest` nor `playwright` appear in `package.json` dependencies — the test job will fail.
- `server.js` stores processing state in a global variable (`processingStatus`), so it's lost on server restart and won't work with multiple server instances.
- The search endpoint combines `$regex` with `$text` in a single `$or` query, which can cause MongoDB to skip the text index and fall back to a collection scan on large datasets.
- No `.env.example` is provided, so the available environment variables (`PORT`, `MONGO_URI`) are undocumented outside this README.
- A stale Vite timestamp file (`vite.config.js.timestamp-*.mjs`) is committed to the repo.

## License

MIT — see [LICENSE](LICENSE).

## Author

[Kaustabh](https://github.com/stabgan)
