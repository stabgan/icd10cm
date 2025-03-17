import { useState } from 'react';
import Search from './Search';
import { Link } from 'react-router-dom';

function Home() {
  const [searchResults, setSearchResults] = useState([]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-800 mb-6">
          ICD-10-CM Browser
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Fast and easy search for ICD-10-CM diagnosis codes. Find detailed information about medical conditions and their corresponding codes.
        </p>
        
        <div className="mt-10 mb-16">
          <Search onSearchResults={setSearchResults} />
        </div>
        
        {searchResults.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mt-14 mb-6 text-left">
              Search Results ({searchResults.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((result) => (
                <Link
                  key={result.code}
                  to={`/code/${result.code}`}
                  className="bg-white rounded-xl p-5 shadow-md transition hover:shadow-lg hover:translate-y-[-2px] border border-gray-100"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <span className="inline-flex bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-md">
                        {result.code}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.category}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
        
        {searchResults.length === 0 && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Fast Search</h3>
              <p className="text-gray-600">
                Search across thousands of ICD-10-CM codes with real-time suggestions as you type.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Detailed View</h3>
              <p className="text-gray-600">
                Get comprehensive details for each code, including categories and context.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Export as Markdown</h3>
              <p className="text-gray-600">
                Download code details in Markdown format for easy documentation and sharing.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home; 