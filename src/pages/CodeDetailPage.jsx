import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { useTheme } from '../contexts/ThemeContext';

function CodeDetailPage() {
  const { codeId } = useParams();
  const [codeData, setCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const fetchCodeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create a proper URL that respects the base path
        const basePath = import.meta.env.BASE_URL || '/';
        const indexUrl = new URL('data/index.json', window.location.origin + basePath).href;
        
        // Get the index file to know where to look for this code
        const indexResponse = await fetch(indexUrl);
        if (!indexResponse.ok) {
          throw new Error('Failed to load index data');
        }
        
        const indexData = await indexResponse.json();
        
        // Since we organize codes by their first character
        if (codeId && codeId.length > 0) {
          const firstChar = codeId.charAt(0);
          
          // Check if we have data for this character
          if (indexData.chunkMap && indexData.chunkMap[firstChar]) {
            const chunkUrl = new URL(`data/chunks/${firstChar}.json`, window.location.origin + basePath).href;
            const chunkResponse = await fetch(chunkUrl);
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

  const handleDownloadPDF = () => {
    if (!codeData) return;
    
    // Create a new jsPDF instance with better quality settings
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Set font sizes
    const titleFontSize = 18;
    const subtitleFontSize = 16;
    const headingFontSize = 14;
    const normalFontSize = 11;
    
    // Add header with logo and title
    doc.setFillColor(41, 98, 255);
    doc.rect(0, 0, 210, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ICD-10-CM Code Browser', 15, 10);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Medical Classification Reference', 15, 16);
    
    // Add title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(`ICD-10-CM: ${codeData.code}`, 15, 35);
    
    // Add description
    doc.setFontSize(subtitleFontSize);
    doc.setFont('helvetica', 'italic');
    doc.text('Description:', 15, 45);
    doc.setFontSize(normalFontSize);
    doc.setFont('helvetica', 'normal');
    
    // Handle wrapping text for description
    const splitDescription = doc.splitTextToSize(codeData.description, 180);
    doc.text(splitDescription, 15, 52);
    
    let yPosition = 52 + (splitDescription.length * 7);
    
    // Add detailed context if available
    if (codeData.detailed_context) {
      // Add section header
      doc.setFontSize(subtitleFontSize);
      doc.setFont('helvetica', 'italic');
      doc.text('Detailed Context:', 15, yPosition + 10);
      yPosition += 20;
      
      // For detailed context, strip markdown but retain structure
      const plainContext = codeData.detailed_context
        .replace(/#{1,6}\s+(.*)/g, '$1\n')  // Convert headers to text with line break
        .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold markers
        .replace(/\*([^*]+)\*/g, '$1')      // Remove italic markers
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') // Convert links to text with URL
        .replace(/^\s*[-*+]\s+/gm, '• ');   // Convert list items to bullets
      
      // Handle wrapping and multipage with better formatting
      doc.setFontSize(normalFontSize);
      doc.setFont('helvetica', 'normal');
      
      // Split text into paragraphs
      const paragraphs = plainContext.split('\n\n');
      
      for (const paragraph of paragraphs) {
        if (paragraph.trim() === '') continue;
        
        // Check if we need a new page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 30; // Reset position on new page
        }
        
        const lines = doc.splitTextToSize(paragraph.trim(), 180);
        doc.text(lines, 15, yPosition);
        yPosition += (lines.length * 7) + 5; // Add space between paragraphs
      }
    }
    
    // Add footer with generated date and page numbers on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Add footer background
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 285, 210, 12, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 15, 292);
      doc.text(`Page ${i} of ${pageCount}`, 180, 292);
    }
    
    // Save the PDF with better naming
    doc.save(`ICD10-CM-${codeData.code}-${codeData.description.substring(0, 20).replace(/[^\w]/g, '-')}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${darkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'} border p-4 rounded-lg shadow-md`}>
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <Link to="/" className={`mt-4 inline-block ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
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
        <Link to="/" className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline flex items-center group`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to search</span>
        </Link>
      </div>
      
      <div className={`${darkMode ? 'bg-dark-surface shadow-xl shadow-black/30 border-gray-800' : 'bg-white shadow-lg border-gray-200'} rounded-xl overflow-hidden border transition-all hover:shadow-xl`}>
        <div className={`${darkMode ? 'bg-gradient-to-r from-blue-800 to-blue-900' : 'bg-gradient-to-r from-blue-600 to-blue-800'} text-white p-6`}>
          <div className="text-sm text-blue-200 uppercase tracking-wider font-medium mb-1">ICD-10-CM Code</div>
          <h1 className="text-3xl font-bold">
            {codeData.code}
          </h1>
        </div>
        
        <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{codeData.description}</h2>
        </div>
        
        {codeData.detailed_context && (
          <div className={`p-6 ${darkMode ? 'bg-dark-surface' : 'bg-white'}`}>
            <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center`}>
              <svg className={`w-5 h-5 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Detailed Context
            </h3>
            <div className={`prose ${darkMode ? 'prose-invert' : 'prose-blue'} max-w-none rounded-lg border ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'} p-5 shadow-inner overflow-auto`}>
              <ReactMarkdown>{codeData.detailed_context}</ReactMarkdown>
            </div>
          </div>
        )}
        
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} p-6 border-t flex justify-between items-center`}>
          <button 
            onClick={handleDownloadPDF}
            className={`${darkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 px-4 rounded-lg transition-colors flex items-center shadow-md hover:shadow-lg`}
          >
            <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download as PDF
          </button>
          
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Code: {codeData.code}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeDetailPage; 