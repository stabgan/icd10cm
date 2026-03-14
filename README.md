# ICD-10-CM Browser

A fast, modern web application for browsing and searching ICD-10-CM medical diagnosis codes, powered by MongoDB and Node.js.

## What It Does

ICD-10-CM Browser lets healthcare professionals, medical coders, and researchers quickly search, browse, and export the full ICD-10-CM code set. Upload a JSONL data file once, and the app indexes everything into MongoDB for instant lookups. A clean split-pane UI shows an alphabetical code sidebar alongside detailed code views.

## Features

- **Full-text search** — find codes by ID, description, or clinical context with real-time suggestions
- **Alphabetical sidebar** — browse the entire code set letter by letter
- **Dark / Light mode** — toggle between themes; respects system preference
- **PDF export** — download any code's details as a formatted PDF
- **Data upload wizard** — guided splash screen with progress bar for first-time setup
- **Server-Sent Events** — live progress updates during data processing
- **Responsive layout** — works on desktop and tablet screens

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ⚛️ Frontend | React 18, React Router 6 |
| 🎨 Styling | Tailwind CSS 3, @tailwindcss/typography |
| 🖥️ Backend | Node.js, Express 4 |
| 🗄️ Database | MongoDB 6 (via official Node driver) |
| 📦 Bundler | Vite 5 |
| 📄 PDF | jsPDF |
| 🔍 Search | MongoDB text indexes + regex |
| 📂 Upload | Multer |

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

**Development** (frontend dev server + API server concurrently):

```bash
npm run dev:all
```

**Production**:

```bash
npm run start        # builds frontend, then starts Express on port 5000
```

Open `http://localhost:5000` (production) or `http://localhost:3000` (dev) and upload your ICD-10-CM `.jsonl` data file when prompted.

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
│   ├── components/      # Reusable UI (Search, Header, Sidebar, etc.)
│   ├── contexts/        # ThemeContext (dark/light mode)
│   ├── pages/           # Route-level pages
│   └── utils/           # API service layer
├── index.html           # Vite entry point
├── tailwind.config.js   # Tailwind + custom medical color palette
└── vite.config.js       # Vite config with API proxy
```

## Known Issues

- Some legacy components (`CodeDetailsPage`, `ImportDialog`, `MarkdownRenderer`, `CodeIndex`) reference MUI and other packages not included in `package.json`. These components are unused in the current routing and can be safely removed or migrated to Tailwind.
- The `CodeDetail.jsx` component fetches from static file paths (`data/index.json`) instead of the MongoDB API — it is superseded by `CodeDetailPage.jsx`.
- MongoDB must be running before the server starts; there is no embedded/fallback database.
- File upload has a 500 MB limit; very large datasets may need the limit adjusted in `server.js`.

## License

See [LICENSE](./LICENSE) for details.
