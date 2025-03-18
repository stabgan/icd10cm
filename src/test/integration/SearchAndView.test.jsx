import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';

// Define mocks at the top level
const navigateMock = vi.fn();
const useThemeMock = vi.fn().mockReturnValue({ 
  theme: 'light', 
  toggleTheme: vi.fn() 
});

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

// Mock the ThemeContext before importing components that use it
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => useThemeMock(),
  ThemeProvider: ({ children }) => <div data-testid="theme-provider">{children}</div>
}));

// Import components after all mocks are defined
import App from '../../App';
import HomePage from '../../pages/HomePage';
import CodeDetailPage from '../../pages/CodeDetailPage';
import * as dataProcessor from '../../utils/dataProcessor';

// Mock the data processor module
vi.mock('../../utils/dataProcessor', () => ({
  checkDataLoaded: vi.fn(() => Promise.resolve(true)),
  getIndexData: vi.fn(() => Promise.resolve({
    totalCodes: 100,
    chunkCount: 5,
    lastUpdated: new Date().toISOString()
  })),
  searchCodes: vi.fn((query) => {
    if (query === 'A00.0') {
      return Promise.resolve([
        { code: 'A00.0', description: 'Cholera due to Vibrio cholerae 01' }
      ]);
    } else if (query === 'diabetes') {
      return Promise.resolve([
        { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
        { code: 'E10.9', description: 'Type 1 diabetes mellitus without complications' }
      ]);
    }
    return Promise.resolve([]);
  }),
  getCode: vi.fn((codeId) => {
    if (codeId === 'A00.0') {
      return Promise.resolve({
        code: 'A00.0',
        description: 'Cholera due to Vibrio cholerae 01',
        detailed_context: '# Cholera due to Vibrio cholerae 01\n\nAn infectious disease caused by the bacterium Vibrio cholerae.'
      });
    } else if (codeId === 'E11.9') {
      return Promise.resolve({
        code: 'E11.9',
        description: 'Type 2 diabetes mellitus without complications',
        detailed_context: '# Type 2 diabetes mellitus\n\nA chronic condition that affects the way the body metabolizes sugar.'
      });
    }
    return Promise.resolve(null);
  })
}));

// Mock react-markdown to avoid rendering issues in tests
vi.mock('react-markdown', () => ({
  default: ({ children }) => <div data-testid="markdown">{children}</div>
}));

describe('Search and View Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockClear();
    useThemeMock.mockReturnValue({ 
      theme: 'light', 
      toggleTheme: vi.fn() 
    });
  });
  
  it('searches for a code and displays results', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage dataStatus={{ loaded: true, totalCodes: 100 }} />
      </MemoryRouter>
    );
    
    // Get the search input - update placeholder text to match what's in the component
    const searchInput = screen.getByPlaceholderText(/Search for an ICD-10-CM code or description.../i);
    expect(searchInput).toBeInTheDocument();
    
    // Type a search query
    fireEvent.change(searchInput, { target: { value: 'diabetes' } });
    
    // Wait for the search results to appear
    await waitFor(() => {
      expect(dataProcessor.searchCodes).toHaveBeenCalledWith('diabetes');
    });
    
    // Check that results are displayed
    await waitFor(() => {
      const e11Elements = screen.getAllByText('E11.9');
      expect(e11Elements.length).toBeGreaterThan(0);
      const e10Elements = screen.getAllByText('E10.9');
      expect(e10Elements.length).toBeGreaterThan(0);
      const type2Elements = screen.getAllByText('Type 2 diabetes mellitus without complications');
      expect(type2Elements.length).toBeGreaterThan(0);
      const type1Elements = screen.getAllByText('Type 1 diabetes mellitus without complications');
      expect(type1Elements.length).toBeGreaterThan(0);
    });
  });
  
  it('navigates to code detail page and shows code information', async () => {
    // Setup in-memory router with routes
    render(
      <MemoryRouter initialEntries={['/code/E11.9']}>
        <Routes>
          <Route path="/code/:codeId" element={<CodeDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Verify getCode was called with correct ID
    expect(dataProcessor.getCode).toHaveBeenCalledWith('E11.9');
    
    // Wait for code details to load
    await waitFor(() => {
      expect(screen.getByText('E11.9')).toBeInTheDocument();
      expect(screen.getByText('Type 2 diabetes mellitus without complications')).toBeInTheDocument();
      expect(screen.getByTestId('markdown')).toBeInTheDocument();
      expect(screen.getByTestId('markdown')).toHaveTextContent('Type 2 diabetes mellitus');
    });
  });
  
  it('performs a full search and navigation flow', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage dataStatus={{ loaded: true, totalCodes: 100 }} />
      </MemoryRouter>
    );
    
    // Search for a code
    const searchInput = screen.getByPlaceholderText(/Search for an ICD-10-CM code or description.../i);
    fireEvent.change(searchInput, { target: { value: 'A00.0' } });
    
    // Wait for the search results
    await waitFor(() => {
      expect(dataProcessor.searchCodes).toHaveBeenCalledWith('A00.0');
    });
    
    // Check that results are displayed
    await waitFor(() => {
      const a00Elements = screen.getAllByText('A00.0');
      expect(a00Elements.length).toBeGreaterThan(0);
      const choleraElements = screen.getAllByText('Cholera due to Vibrio cholerae 01');
      expect(choleraElements.length).toBeGreaterThan(0);
    });
    
    // Get the first list item with Cholera in it
    const resultItems = screen.getAllByText('Cholera due to Vibrio cholerae 01');
    const resultItem = resultItems[0].closest('div') || resultItems[0];
    
    // Click on the result (simulating navigation)
    fireEvent.click(resultItem);
    
    // Verify navigation would occur
    await waitFor(() => {
      // Since we're not in a real router context with the Link component fully working,
      // we're checking if navigate would be called in our test setup
      expect(navigateMock).toHaveBeenCalled();
      // or in a real app, we'd check the URL or page change
    });
  });
}); 