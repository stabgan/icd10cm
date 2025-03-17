import { useState } from 'react';
import { Link } from 'react-router-dom';
import Search from '../components/Search';

function HomePage({ dataStatus }) {
  const [searchResults, setSearchResults] = useState([]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-blue-800">
          ICD-10-CM Code Browser
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Search and explore the International Classification of Diseases, 
          10th Revision, Clinical Modification codes.
        </p>
        {dataStatus.totalCodes && (
          <p className="mt-2 text-sm text-gray-500">
            Database contains {dataStatus.totalCodes.toLocaleString()} ICD-10-CM codes
          </p>
        )}
      </div>
      
      <div className="mb-16">
        <Search onSearchResults={setSearchResults} />
      </div>
      
      {searchResults.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Search Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((result) => (
              <Link 
                key={result.code} 
                to={`/code/${result.code}`} 
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition border border-gray-200"
              >
                <div className="font-bold text-blue-600">{result.code}</div>
                <p className="text-sm mt-1 text-gray-700">{result.description}</p>
                <div className="mt-2 text-xs text-gray-500">{result.category}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {searchResults.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4">How to use this tool</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Search by ICD-10-CM code (e.g., "E11.9")</li>
            <li>Search by medical condition (e.g., "diabetes")</li>
            <li>Search by symptoms or keywords</li>
            <li>Click on any result to view detailed information</li>
            <li>Download information for offline reference</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default HomePage; 