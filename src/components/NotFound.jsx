import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center">
      <div className="text-center max-w-lg">
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        
        <div className="w-full h-0.5 bg-gray-200 my-8"></div>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
        
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved. 
          Perhaps you were looking for a specific ICD code?
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/" 
            className="px-5 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-medium"
          >
            Go Home
          </Link>
          
          <Link 
            to="/" 
            className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Search Codes
          </Link>
        </div>
      </div>
      
      <div className="mt-16">
        <svg 
          width="280" 
          height="140" 
          viewBox="0 0 280 140" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="mx-auto opacity-80"
        >
          <path 
            d="M274 30c-28 53.333-56 80-84 80s-56-26.667-84-80C78 76.667 50 103.333 22 110"
            stroke="#2563EB" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          <path 
            d="M22 30c28 53.333 56 80 84 80s56-26.667 84-80c28 46.667 56 73.333 84 80" 
            stroke="#93C5FD" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeDasharray="8 8"
          />
          <circle cx="64" cy="50" r="6" fill="#2563EB" />
          <circle cx="226" cy="70" r="6" fill="#2563EB" />
          <circle cx="150" cy="110" r="10" fill="#2563EB" />
        </svg>
      </div>
    </div>
  );
}

export default NotFound; 