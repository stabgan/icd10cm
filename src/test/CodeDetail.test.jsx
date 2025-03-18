import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CodeDetail from '../components/CodeDetail';

// Mock data
const mockCodeData = {
  code: 'A001',
  description: 'Test Disease 1',
  detailed_context: '# Test Disease 1\n\nDetailed information about the disease'
};

// Mock the fetch function
vi.stubGlobal('fetch', vi.fn());

// Mock the jsPDF library to avoid errors in tests
vi.mock('jspdf', () => ({
  default: class MockJsPDF {
    setFont() { return this; }
    setFontSize() { return this; }
    text() { return this; }
    addImage() { return this; }
    save() { return this; }
  }
}));

describe('CodeDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the index.json response
    global.fetch.mockImplementation((url) => {
      if (url.includes('index.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            chunkMap: { A: 'A' }
          })
        });
      } else if (url.includes('chunks/A.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockCodeData])
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });
  
  it('renders code details when code is found', async () => {
    render(
      <MemoryRouter initialEntries={['/code/A001']}>
        <Routes>
          <Route path="/code/:codeId" element={<CodeDetail />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Check for loading state first by looking for the animate-pulse class
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    
    // Wait for code details to load
    await waitFor(() => {
      expect(screen.getAllByText('A001').length).toBeGreaterThan(0);
      expect(screen.getByText('Test Disease 1')).toBeInTheDocument();
    });
    
    // Verify that fetch was called with the right URLs
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][0]).toContain('index.json');
    expect(global.fetch.mock.calls[1][0]).toContain('chunks/A.json');
  });
}); 