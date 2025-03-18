# ICD-10-CM Code Browser

A modern, fast, and beautiful web application for browsing and searching ICD-10-CM medical diagnosis codes. Built with React, Vite, and TailwindCSS.

## Features

- ⚡️ **Blazing fast search** across all ICD-10-CM codes and descriptions using Fuse.js
- 🎨 **Beautiful modern UI** with a clean, responsive design that works on all devices
- 🌐 **Efficient data loading** using a chunked approach to minimize initial load times
- 📱 **Mobile-first design** that works seamlessly on desktop and mobile devices
- 🔍 **Detailed code view** with full context and information in markdown format
- 💾 **Download support** for saving code details in Markdown format
- 🌙 **Performance optimized** with code splitting and optimized assets
- ♿ **Accessible design** following WCAG guidelines

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

   The app will open at http://localhost:3030 in your browser.

### Data File Structure

Your JSONL file should contain records in the following format:

```jsonl
{"code": "A001", "description": "Cholera due to Vibrio cholerae 01, biovar eltor", "detailed_context": "### 1. Disease Overview\n\n*   **Definition and Epidemiology:** Cholera, caused by *Vibrio cholerae* O1 biovar El Tor, is an acute diarrheal illness..."}
```

The `completed_icd_codes.json` file should contain an array of codes that should be included in the browser:

```json
["A001", "A014", "B001", ...]
```

## Local Project Structure

- `/data` - Contains the source ICD-10-CM data files
- `/public/data` - Contains processed data files (generated by the process-data script)
- `/src/components` - React components
- `/src/pages` - Page components for routes
- `/scripts` - Data processing scripts

## Data Processing

The `process-data.js` script handles:

1. Reading your raw JSONL data file
2. Filtering it based on the completed codes list
3. Creating an optimized search index
4. Chunking the data by the first character of each code
5. Generating metadata for efficient loading

This makes the application fast and responsive even with large datasets.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Credits

- Built with [React](https://reactjs.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Search powered by [Fuse.js](https://fusejs.io/)
- Bundled with [Vite](https://vitejs.dev/) 