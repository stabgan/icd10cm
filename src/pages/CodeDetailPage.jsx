import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';

function CodeDetailPage() {
  const { codeId } = useParams();
  const [codeData, setCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCodeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the index file to know where to look for this code
        const indexResponse = await fetch('/data/index.json');
        if (!indexResponse.ok) {
          throw new Error('Failed to load index data');
        }
        
        const indexData = await indexResponse.json();
        
        // Since we organize codes by their first character
        if (codeId && codeId.length > 0) {
          const firstChar = codeId.charAt(0);
          
          // Check if we have data for this character
          if (indexData.chunkMap && indexData.chunkMap[firstChar]) {
            const chunkResponse = await fetch(`/data/chunks/${firstChar}.json`);
            if (!chunkResponse.ok) {
              throw new Error(`Failed to load chunk data for codes starting with '${firstChar}'`);
            }
            
            const chunkData = await chunkResponse.json();
            const foundCode = chunkData.find(code => code.code === codeId);
            
            if (foundCode) {
              setCodeData(foundCode);
            } else {
              setError(`ICD-10-CM code ${codeId} not found`);
            }
          } else {
            setError(`No data available for codes starting with '${firstChar}'`);
          }
        } else {
          setError('Invalid code ID');
        }
      } catch (err) {
        console.error('Error fetching code data:', err);
        setError('Failed to load code data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCodeData();
  }, [codeId]);

  const handleDownload = () => {
    if (!codeData) return;
    
    // Create a markdown version for download
    const markdownContent = `
# ${codeData.code}: ${codeData.description}

## Description
${codeData.description || 'No description available.'}

${codeData.detailed_context ? '## Detailed Context\n' + codeData.detailed_context : ''}

${codeData.category ? '## Category\n' + codeData.category : ''}

${codeData.notes ? '## Notes\n' + codeData.notes : ''}

${codeData.additionalInfo ? '## Additional Information\n' + codeData.additionalInfo : ''}
`.trim();
    
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `ICD10-${codeData.code}.md`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Return to search
        </Link>
      </div>
    );
  }

  if (!codeData) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:underline flex items-center group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to search</span>
        </Link>
      </div>
      
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 transition-all hover:shadow-xl">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="text-sm text-blue-200 uppercase tracking-wider font-medium mb-1">ICD-10-CM Code</div>
          <h1 className="text-3xl font-bold flex items-baseline">
            {codeData.code}
            {codeData.category && (
              <span className="ml-3 text-sm font-normal bg-white/20 text-white py-1 px-2 rounded-md">
                {codeData.category}
              </span>
            )}
          </h1>
        </div>
        
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">{codeData.description}</h2>
        </div>
        
        {codeData.detailed_context && (
          <div className="p-6 bg-white">
            <h3 className="text-lg font-medium mb-3 text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Detailed Context
            </h3>
            <div className="prose prose-blue max-w-none rounded-lg border border-gray-100 bg-gray-50 p-5 shadow-inner overflow-auto">
              <ReactMarkdown>{codeData.detailed_context}</ReactMarkdown>
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between items-center">
          <button 
            onClick={handleDownload}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download as Markdown
          </button>
          
          <div className="text-sm text-gray-500">
            Code: {codeData.code}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeDetailPage; 