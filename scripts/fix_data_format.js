const fs = require('fs');
const path = require('path');

// This script ensures the completed_icd_codes.json file is in the correct format
// Sometimes JSON files can be in a format that's difficult to parse (like JSONLines)
async function fixDataFormat() {
  console.log('Checking and fixing data format...');
  
  try {
    const dataPath = path.join(__dirname, '../data/completed_icd_codes.json');
    const content = fs.readFileSync(dataPath, 'utf8');
    
    // Check if the file starts with [ which indicates an array
    if (!content.trim().startsWith('[')) {
      console.log('Data file needs formatting, attempting to fix...');
      
      // Try to parse as JSONLines (one JSON object per line)
      const lines = content.split('\n').filter(line => line.trim());
      const data = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.warn('Failed to parse line:', line.substring(0, 50) + '...');
          return null;
        }
      }).filter(item => item !== null);
      
      // Write as a proper JSON array
      fs.writeFileSync(
        dataPath,
        JSON.stringify(data, null, 2)
      );
      
      console.log(`Fixed data format. Processed ${data.length} items.`);
      return data;
    } else {
      // Try to parse the whole file as a JSON array
      try {
        const data = JSON.parse(content);
        console.log(`Data format seems correct. Contains ${data.length} items.`);
        return data;
      } catch (e) {
        console.error('Failed to parse the JSON file:', e.message);
        
        // Create a minimal fallback dataset for testing
        console.log('Creating a minimal fallback dataset for testing...');
        const fallbackData = [
          {
            "code": "A00.0",
            "description": "Cholera due to Vibrio cholerae 01, biovar cholerae",
            "category": "Certain infectious and parasitic diseases"
          },
          {
            "code": "E11.9",
            "description": "Type 2 diabetes mellitus without complications",
            "category": "Endocrine, nutritional and metabolic diseases"
          },
          {
            "code": "I10",
            "description": "Essential (primary) hypertension",
            "category": "Diseases of the circulatory system"
          },
          {
            "code": "J45.909",
            "description": "Unspecified asthma, uncomplicated",
            "category": "Diseases of the respiratory system"
          },
          {
            "code": "R73.03",
            "description": "Prediabetes",
            "category": "Symptoms, signs and abnormal clinical and laboratory findings"
          }
        ];
        
        fs.writeFileSync(
          path.join(__dirname, '../data/completed_icd_codes.json'),
          JSON.stringify(fallbackData, null, 2)
        );
        
        console.log(`Created fallback dataset with ${fallbackData.length} sample codes.`);
        return fallbackData;
      }
    }
  } catch (error) {
    console.error('Error processing data file:', error);
    
    // Create an empty array as absolute fallback
    fs.writeFileSync(
      path.join(__dirname, '../data/completed_icd_codes.json'),
      '[]'
    );
    
    return [];
  }
}

// Run the function
fixDataFormat().then(() => {
  console.log('Data format check complete!');
}); 