import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { useTheme } from '../contexts/ThemeContext';
import { getCode } from '../utils/apiService';

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
        
        if (!codeId || codeId.length === 0) {
          setError('Invalid code ID');
          return;
        }
        
        // Try to get from IndexedDB first
        const code = await getCode(codeId);
        
        if (code) {
          setCodeData(code);
        } else {
          setError(`ICD-10-CM code ${codeId} not found`);
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

  return (
    <div className="w-full h-full overflow-auto">
      {/* Back button with improved visibility */}
      <div className="mb-6 pt-4 px-4">
        <Link 
          to="/" 
          className={`inline-flex items-center px-4 py-2 rounded-lg transition-all
                    ${darkMode 
                      ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' 
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}
                    border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to search
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-b-4 rounded-full animate-spin border-blue-500"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading code details...</p>
        </div>
      ) : error ? (
        <div className={`rounded-lg p-6 mx-4 ${
          darkMode ? 'bg-red-900/20 border border-red-800 text-red-200' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      ) : codeData ? (
        <div className="mx-4 mb-8">
          {/* Code header section */}
          <div className={`rounded-t-xl p-6 ${darkMode ? 'bg-blue-900' : 'bg-blue-600'} text-white`}>
            <div className="mb-2 text-sm font-medium text-blue-200">ICD-10-CM CODE</div>
            <h1 className="text-4xl font-bold mb-2">{codeData.code}</h1>
          </div>
          
          {/* Description section */}
          <div className={`p-6 rounded-b-xl mb-6 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-4">{codeData.description}</h2>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={handleDownloadPDF}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all
                          ${darkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                          border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </button>
            </div>
          </div>
          
          {/* Detailed context section - Fix property name mismatch */}
          {codeData.detailed_context && (
            <div className={`rounded-xl p-6 shadow-md mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center text-blue-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold">Detailed Context</h3>
              </div>
              
              <div className={`prose max-w-none ${darkMode ? 'prose-dark' : 'prose-light'}`}>
                <ReactMarkdown>
                  {codeData.detailed_context}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
          {/* Include related codes if available */}
          {codeData.related_codes && codeData.related_codes.length > 0 && (
            <div className={`rounded-xl p-6 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Related Codes
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {codeData.related_codes.map(code => (
                  <Link
                    key={code.code}
                    to={`/code/${code.code}`}
                    className={`p-4 rounded-lg transition-all ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-bold text-blue-500">{code.code}</div>
                    <div className="text-sm">{code.description}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default CodeDetailPage; 