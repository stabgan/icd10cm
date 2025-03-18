import { useTheme } from '../contexts/ThemeContext';

function LoadingScreen({ message = 'Loading...' }) {
  const { darkMode } = useTheme();
  
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="text-center">
        <div className={`inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
          darkMode ? 'border-blue-400' : 'border-blue-500'
        } mb-4`}></div>
        <h2 className={`text-xl font-semibold ${
          darkMode ? 'text-gray-200' : 'text-gray-700'
        }`}>{message}</h2>
      </div>
    </div>
  );
}

export default LoadingScreen; 