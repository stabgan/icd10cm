// API Service for communicating with the backend

const API_URL = 'http://localhost:5000/api';

// Check if data is loaded on the server
export async function checkDataLoaded() {
  try {
    const response = await fetch(`${API_URL}/check-data`);
    const data = await response.json();
    return data.loaded;
  } catch (error) {
    console.error('Error checking data loaded:', error);
    return false;
  }
}

// Get index metadata
export async function getIndexData() {
  try {
    const response = await fetch(`${API_URL}/code-index`);
    if (!response.ok) {
      throw new Error(`Failed to fetch index data: ${response.status}`);
    }
    const data = await response.json();
    return {
      totalCodes: data.totalCodes || 0,
      lastUpdated: data.lastUpdated || null,
      chunkMap: data.chunkMap || {}
    };
  } catch (error) {
    console.error('Error getting index data:', error);
    return {
      totalCodes: 0,
      lastUpdated: null,
      chunkMap: {}
    };
  }
}

// Search for codes
export async function searchCodes(query) {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching codes:', error);
    return [];
  }
}

// Get a specific code
export async function getCode(code) {
  if (!code) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/code/${encodeURIComponent(code)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.code || null;
  } catch (error) {
    console.error(`Error getting code ${code}:`, error);
    return null;
  }
}

// Get codes for a specific letter
export async function getCodesForLetter(letter) {
  if (!letter) {
    return [];
  }

  try {
    const response = await fetch(`${API_URL}/codes/${encodeURIComponent(letter)}`);
    const data = await response.json();
    return data.codes || [];
  } catch (error) {
    console.error(`Error getting codes for letter ${letter}:`, error);
    return [];
  }
}

// Reset database and reload from original file
export async function resetDatabase() {
  try {
    const response = await fetch(`${API_URL}/reset-database`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error resetting database');
    }
    
    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error resetting database:', error);
    return { success: false, error: error.message };
  }
} 