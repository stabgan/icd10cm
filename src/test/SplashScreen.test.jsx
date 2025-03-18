import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SplashScreen from '../components/SplashScreen';
import * as dataProcessor from '../utils/dataProcessor';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock react-router-dom's useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate
  };
});

// Create a mocked navigate function
const mockedNavigate = vi.fn();

// Mock the ThemeContext to bypass the matchMedia issue
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ darkMode: false, toggleDarkMode: vi.fn() }),
  ThemeProvider: ({ children }) => <div data-testid="theme-provider">{children}</div>
}));

// Mock the dataProcessor utility
vi.mock('../utils/dataProcessor', () => ({
  processICD10Data: vi.fn((file, progressCallback) => {
    // Call the progress callback a few times to simulate progress
    progressCallback(10);
    progressCallback(50);
    progressCallback(100);
    
    return Promise.resolve({
      id: 'main',
      totalCodes: 2,
      chunkCount: 2,
      lastUpdated: new Date().toISOString()
    });
  })
}));

describe('SplashScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders correctly', () => {
    render(
      <BrowserRouter>
        <SplashScreen />
      </BrowserRouter>
    );
    
    // Check that the main title and upload button are present
    expect(screen.getByText('ICD-10-CM Browser')).toBeInTheDocument();
    expect(screen.getByText('Upload Data File')).toBeInTheDocument();
  });
  
  it('handles file upload correctly', async () => {
    render(
      <BrowserRouter>
        <SplashScreen />
      </BrowserRouter>
    );
    
    // Create a mock file
    const file = new File(['test content'], 'test.jsonl', { type: 'application/json' });
    
    // Get the file input
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });
    
    // Check that processICD10Data was called with the file
    expect(dataProcessor.processICD10Data).toHaveBeenCalledWith(file, expect.any(Function));
    
    // Verify progress is shown
    await waitFor(() => {
      expect(screen.getByText(/Processing data/)).toBeInTheDocument();
    });
    
    // Check that navigation happens after processing
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/');
    }, { timeout: 2000 });
  });
  
  it('shows error for invalid file type', async () => {
    render(
      <BrowserRouter>
        <SplashScreen />
      </BrowserRouter>
    );
    
    // Create a mock file with unsupported extension
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Get the file input
    const input = document.querySelector('input[type="file"]');
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });
    
    // Check that an error message is shown
    expect(screen.getByText('Please upload a JSONL or JSON file')).toBeInTheDocument();
    
    // Verify that processICD10Data was not called
    expect(dataProcessor.processICD10Data).not.toHaveBeenCalled();
  });
}); 