import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

function Footer() {
  const currentYear = new Date().getFullYear();
  const { darkMode } = useTheme();
  
  return (
    <footer className={`py-6 px-4 border-t ${
      darkMode ? 'border-gray-800 bg-dark-surface text-gray-300' : 'border-gray-200 bg-white text-gray-800'
    } transition-colors duration-300`}>
      <div className="container mx-auto">
        <div className="flex flex-col items-center">
          {/* Dedication message with gradient */}
          <div className="text-center mb-6 max-w-2xl mx-auto transform hover:scale-105 transition-transform duration-300">
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Behold, the Creator:</p>
            <div className="relative">
              <p className="font-beast text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-red-500 to-purple-600 animate-gradient-fire py-2 px-4 drop-shadow-glow tracking-wider">
                CREATED BY MUSAFIR
              </p>
              <p className={`font-comic text-base md:text-lg font-bold italic mt-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <span className="text-xl">🦁</span> Lord of the Night & King of All Animals
              </p>
              <div className="absolute -top-3 -right-3 text-2xl animate-bounce">👑</div>
            </div>
          </div>
          
          {/* Main footer content in 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8 w-full max-w-4xl text-center md:text-left mb-6">
            <div>
              <h3 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>About</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="https://www.cms.gov/Medicare/Coding/ICD10" target="_blank" rel="noreferrer" className={`${
                    darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'
                  } transition-colors`}>
                    Official ICD-10-CM Resources
                  </a>
                </li>
                <li>
                  <a href="https://www.who.int/standards/classifications/classification-of-diseases" target="_blank" rel="noreferrer" className={`${
                    darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'
                  } transition-colors`}>
                    WHO Classification
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="https://www.cdc.gov/nchs/icd/icd10cm.htm" target="_blank" rel="noreferrer" className={`${
                    darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'
                  } transition-colors`}>
                    CDC ICD-10-CM
                  </a>
                </li>
                <li>
                  <a href="https://www.aapc.com/codes/icd-10-codes-range/" target="_blank" rel="noreferrer" className={`${
                    darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'
                  } transition-colors`}>
                    AAPC Code Lookup
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/terms" className={`${
                    darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'
                  } transition-colors`}>
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className={`${
                    darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'
                  } transition-colors`}>
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Copyright */}
          <div className={`text-sm ${
            darkMode ? 'text-gray-400 border-gray-800' : 'text-gray-500 border-gray-200'
          } pt-4 border-t w-full text-center`}>
            <p>© {currentYear} ICD-10-CM Browser. All rights reserved.</p>
            <p className="text-xs mt-2">
              ICD-10-CM is a registered trademark of the World Health Organization.
              This application is for educational purposes only.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 