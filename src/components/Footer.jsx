function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <svg 
                className="w-8 h-8 mr-2 text-blue-500" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path>
                <polyline points="13 11 9 17 15 17 11 23"></polyline>
              </svg>
              <div>
                <div className="text-xl font-bold">
                  <span className="font-extrabold tracking-tight">ICD-10-CM</span>
                  <span className="ml-1 font-light">Browser</span>
                </div>
              </div>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              A modern application for searching and exploring the International Classification 
              of Diseases, 10th Revision, Clinical Modification (ICD-10-CM) codes.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://www.cdc.gov/nchs/icd/icd10cm.htm" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition"
                  >
                    CDC ICD-10-CM
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.who.int/standards/classifications/classification-of-diseases" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition"
                  >
                    WHO Classification
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Links</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://github.com/stabgan/icd10cm" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition"
                  >
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/stabgan/icd10cm/issues" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition"
                  >
                    Report Issues
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500">
            &copy; {currentYear} ICD-10-CM Browser. All rights reserved.
          </p>
          <p className="text-xs mt-2 text-gray-600">
            This tool is provided for informational purposes only. 
            Always consult official documentation for accurate coding information.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 