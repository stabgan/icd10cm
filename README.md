# ICD-10-CM Code Browser

A modern, fast, and beautiful web application for browsing and searching ICD-10-CM medical diagnosis codes. Built with React, Vite, and TailwindCSS.

![ICD-10-CM Browser Screenshot](https://via.placeholder.com/800x450/3b82f6/FFFFFF?text=ICD-10-CM+Browser)

## Features

- ⚡️ **Blazing fast search** across all ICD-10-CM codes and descriptions using Fuse.js
- 🎨 **Beautiful modern UI** with a clean, responsive design that works on all devices
- 🌐 **Efficient data loading** using a chunked approach to minimize initial load times
- 📱 **Mobile-first design** that works seamlessly on desktop and mobile devices
- 🔍 **Detailed code view** with full context and information in markdown format
- 💾 **Download support** for saving code details in Markdown format
- 🌙 **Performance optimized** with code splitting and optimized assets
- ♿ **Accessible design** following WCAG guidelines

## Data Handling Approach

Since the ICD-10-CM data files are large and not suitable for GitHub, we use the following approach:

1. **Local Data Processing**: Process your JSONL data files locally using our included script
2. **Static Site Generation**: Generate the processed data files during build
3. **Deploy Options**:
   - Option 1: Host the processed data files on a CDN or object storage service
   - Option 2: Deploy to a hosting service with large file support
   - Option 3: Use a data API endpoint that can serve the chunks on demand

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- ICD-10-CM data files in JSONL format (as shown in the example)

### Local Development Setup

1. Clone the repository
   ```
   git clone https://github.com/stabgan/icd10cm.git
   cd icd10cm
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up your data files:
   - Place your JSONL data file at `data/icd10_cm_code_detailed.jsonl`
   - Place your completed codes list at `data/completed_icd_codes.json`

4. Process the data (this generates the searchable indexes and chunks)
   ```
   npm run process-data
   ```

5. Start the development server
   ```
   npm run dev
   ```

### Data File Structure

Your JSONL file should contain records in the following format:

```jsonl
{"code": "A001", "description": "Cholera due to Vibrio cholerae 01, biovar eltor", "detailed_context": "### 1. Disease Overview\n\n*   **Definition and Epidemiology:** Cholera, caused by *Vibrio cholerae* O1 biovar El Tor, is an acute diarrheal illness..."}
```

The `completed_icd_codes.json` file should contain an array of codes that should be included in the browser:

```json
["A001", "A014", "B001", ...]
```

## Deployment Options

### Option 1: GitHub Pages with External Data Storage

1. Process your data locally:
   ```
   npm run process-data
   ```

2. Upload the generated `public/data` directory to:
   - AWS S3
   - Google Cloud Storage
   - Azure Blob Storage
   - Any CDN service

3. Update the data fetch URLs in your code to point to your storage location

4. Build and deploy the app to GitHub Pages:
   ```
   npm run build
   npm run deploy
   ```

### Option 2: Full-Service Hosting (Vercel, Netlify, etc.)

1. Configure the hosting service to run the data processing script during build:
   ```
   # Example netlify.toml
   [build]
     publish = "dist"
     command = "npm run process-data && npm run build"
   ```

2. Upload your data files directly to the hosting service (if file size limits allow)

3. Deploy your application

### Option 3: Separate Data API

1. Create a simple data API server that serves the chunked data files
2. Deploy your frontend app to GitHub Pages
3. Update the fetch URLs to point to your API

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Credits

- Built with [React](https://reactjs.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Search powered by [Fuse.js](https://fusejs.io/)
- Bundled with [Vite](https://vitejs.dev/) 