# ICD-10-CM Browser

A fast, modern web application for browsing and searching ICD-10-CM medical diagnosis codes.

## What It Does

Upload a JSONL data file containing ICD-10-CM codes, and the app indexes everything into MongoDB for instant full-text search. A split-pane UI shows an alphabetical code sidebar alongside detailed code views with PDF export, dark/light theming, and live progress during data import.

## Architecture

```
Browser (React 18 SPA)
  ├── Search bar → /api/search (MongoDB text index + regex)
  ├── Sidebar   → /api/codes/:letter
  ├── Detail    → /api/code/:id (with PDF export via jsPDF)
  └── Upload    → /api/process-file (multer + SSE progress)

Express Server (Node.js)
  ├── Helmet security headers
  ├── CORS middleware
  ├── MongoDB driver (shared client, graceful shutdown)
  └── Static file serving (Vite build output)
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| ⚛️ Frontend | React 18, React Router 6 |
| 🎨 Styling | Tailwind CSS 3, @tailwindcss/typography |
| 🖥️ Backend | Node.js, Express 4 |
| 🔒 Security | Helmet (HTTP headers) |
| 🗄️ Database | MongoDB 6 (official Node driver) |
| 📦 Bundler | Vite 5 |
| 📄 PDF | jsPDF |
| 🔍 Search | MongoDB text indexes + escaped regex |
| 📂 Upload | Multer (500 MB limit) |

## Prerequisites

- **Node.js** ≥ 18
- **MongoDB** ≥ 6 running on `localhost:27017` (or set `MONGO_URI`)

## Installation

```bash
git clone https://github.com/stabgan/icd10cm.git
cd icd10cm
npm install
```

## Running

Development (frontend + API concurrently):

```bash
npm run dev:all
```

Production:

```bash
npm run start        # builds frontend, then starts Express on port 5000
```

Open `http://localhost:5000` (production) or `http://localhost:3000` (dev) and upload your `.jsonl` data file when prompted.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Express server port |
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |

## Project Structure

```
├── server.js            # Express API (search, upload, SSE progress)
├── src/
│   ├── App.jsx          # Root component with routing
│   ├── components/      # Search, Header, CodeSidebar, SplashScreen, etc.
│   ├── contexts/        # ThemeContext (dark/light mode)
│   ├── pages/           # HomePage, CodeDetailPage
│   └── utils/           # apiService (fetch wrapper)
├── scripts/             # Data processing & Electron build helpers
├── index.html           # Vite entry point
├── tailwind.config.js   # Tailwind + custom medical color palette
└── vite.config.js       # Vite config with API proxy
```

## ⚠️ Known Issues

- Several legacy components (`CodeDetailsPage`, `CodeIndex`, `ImportDialog`, `MarkdownRenderer`, `CodeSearchResultsPage`) import MUI, Fuse.js, remark-gfm, and react-window which are not in `package.json`. These components are unused in the current routing and can be removed or migrated.
- The old `CodeDetail.jsx` fetches from static file paths instead of the MongoDB API — it is superseded by `CodeDetailPage.jsx`.
- MongoDB must be running before the server starts; there is no embedded fallback.
- File upload limit is 500 MB; adjust in `server.js` for larger datasets.

## License

See [LICENSE](./LICENSE) for details.
