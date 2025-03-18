import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Breadcrumbs from './Breadcrumbs';

function CodeDetail() {
  const [codeData, setCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [copyStatus, setCopyStatus] = useState('Copy to clipboard');
  const { codeId } = useParams();

  useEffect(() => {
    const fetchCodeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create proper URLs that respect the base path
        const basePath = import.meta.env.BASE_URL || '/';
        const indexUrl = new URL('data/index.json', window.location.origin + basePath).href;
        
        // Determine the correct chunk file to load
        const response = await fetch(indexUrl);
        
        if (!response.ok) {
          throw new Error('Failed to load index file');
        }
        
        const indexData = await response.json();
        const chunkMap = indexData.chunkMap || {};
        const chunkFile = chunkMap[codeId.charAt(0)] || '0';
        
        // Load the chunk containing our code
        const chunkUrl = new URL(`data/chunks/${chunkFile}.json`, window.location.origin + basePath).href;
        const chunkResponse = await fetch(chunkUrl);
        
        if (!chunkResponse.ok) {
          throw new Error(`Failed to load chunk ${chunkFile}`);
        }
        
        const chunkData = await chunkResponse.json();
        const foundCode = chunkData.find(c => c.code === codeId);
        
        if (!foundCode) {
          throw new Error(`Code ${codeId} not found`);
        }
        
        setCodeData(foundCode);
        
        // Generate markdown
        const md = generateMarkdown(foundCode);
        setMarkdownContent(md);
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchCodeData();
  }, [codeId]);

  const generateMarkdown = (data) => {
    if (!data) return '';
    
    return `# ${data.code} - ${data.description}

## Category
${data.category}

## Details
${data.context || 'No additional context available.'}
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent)
      .then(() => {
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy to clipboard'), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        setCopyStatus('Failed to copy');
      });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Link to="/" className="text-sm font-medium text-red-600 hover:text-red-500">
                  Return to home page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!codeData) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs 
        items={[
          { label: 'Home', path: '/' },
          { label: codeData.code, path: `/code/${codeData.code}`, active: true },
        ]} 
      />
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
        <div className="p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 text-sm font-bold rounded-full bg-blue-100 text-blue-800">
              {codeData.code}
            </span>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
              {codeData.category}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {codeData.description}
          </h1>
          
          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Details</h2>
            <div className="prose max-w-none">
              <p className="text-gray-600 leading-relaxed">
                {codeData.context || 'No additional context available.'}
              </p>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Markdown</h2>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  copyStatus === 'Copied!' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
                onClick={handleCopyMarkdown}
              >
                {copyStatus === 'Copied!' ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    {copyStatus}
                  </span>
                )}
              </button>
            </div>
            
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <SyntaxHighlighter
                language="markdown"
                style={vscDarkPlus}
                className="rounded-xl text-sm"
              >
                {markdownContent}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeDetail; 