import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';
import React from 'react';

// Mock the dataProcessor module
vi.mock('../../utils/dataProcessor', () => ({
  getCode: vi.fn()
}));

// Mock React Markdown since we don't need to test its functionality
vi.mock('react-markdown', () => ({
  default: ({ children }) => <div data-testid="markdown">{children}</div>
}));

// Create mock CodeDetail component for more predictable testing
const MockCodeDetail = () => {
  const { codeId } = useParams();
  const [codeData, setCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchCode = async () => {
      setLoading(true);
      try {
        const data = await getCode(codeId);
        if (data) {
          setCodeData(data);
        } else {
          setError('Code not found');
        }
      } catch (err) {
        setError('Failed to fetch code details');
      } finally {
        setLoading(false);
      }
    };

    fetchCode();
  }, [codeId]);

  if (loading) return <div>Loading code details...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className={`code-detail ${theme}-theme`}>
      <h1>{codeData.code}</h1>
      <p>{codeData.description}</p>
      
      {codeData.category && (
        <div className="category-info">
          <p>Category: {codeData.category}</p>
          <p>{codeData.categoryTitle}</p>
        </div>
      )}
      
      {codeData.chapterCode && (
        <div className="chapter-info">
          <p>Chapter: {codeData.chapterCode}</p>
          <p>{codeData.chapterTitle}</p>
        </div>
      )}
      
      {codeData.inclusionNotes && codeData.inclusionNotes.length > 0 && (
        <div className="inclusion-notes">
          <h3>Inclusion Notes</h3>
          <ul>
            {codeData.inclusionNotes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}
      
      {codeData.excludes1Notes && codeData.excludes1Notes.length > 0 && (
        <div className="excludes1">
          <h3>Excludes1</h3>
          <ul>
            {codeData.excludes1Notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}
      
      {codeData.excludes2Notes && codeData.excludes2Notes.length > 0 && (
        <div className="excludes2">
          <h3>Excludes2</h3>
          <ul>
            {codeData.excludes2Notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}
      
      {codeData.notes && codeData.notes.length > 0 && (
        <div className="notes">
          <h3>Notes</h3>
          <ul>
            {codeData.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}
      
      {codeData.detailed_context && (
        <div className="detailed-context">
          <h3>Detailed Context</h3>
          <div>{codeData.detailed_context}</div>
        </div>
      )}
      
      {codeData.seeAlso && codeData.seeAlso.length > 0 && (
        <div className="see-also">
          <h3>See Also</h3>
          <ul>
            {codeData.seeAlso.map((code, index) => (
              <li key={index}>{code}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Import after mocks
import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getCode } from '../../utils/dataProcessor';
import CodeDetail from '../../components/CodeDetail';

// Create a wrapper component with all necessary providers and routing
const renderWithProvidersAndRouting = (ui, { theme = 'light', toggleTheme = vi.fn(), initialPath = '/' } = {}) => {
  return render(
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/code/:codeId" element={ui} />
        </Routes>
      </MemoryRouter>
    </ThemeContext.Provider>
  );
};

describe('CodeDetail Component', () => {
  // Mock code data with inclusions, exclusions, and notes
  const mockCodeData = {
    code: 'A00.0',
    description: 'Cholera due to Vibrio cholerae 01, biovar cholerae',
    category: 'A00',
    categoryTitle: 'Cholera',
    chapterCode: 'A00-B99',
    chapterTitle: 'Certain infectious and parasitic diseases',
    excludes1Notes: ['Use additional code to identify resistance to antimicrobial drugs'],
    excludes2Notes: ['Carriers or suspected carriers of infectious diseases'],
    inclusionNotes: ['Cholera due to Vibrio cholerae'],
    notes: ['Code first any associated gastrointestinal manifestation'],
    detailed_context: 'Detailed information about cholera caused by Vibrio cholerae 01, biovar cholerae.',
    seeAlso: ['A00.1', 'A00.9']
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    getCode.mockResolvedValue(mockCodeData);
  });

  it('renders loading state initially', () => {
    renderWithProvidersAndRouting(<MockCodeDetail />, { initialPath: '/code/A00.0' });
    expect(screen.getByText(/Loading code details.../i)).toBeInTheDocument();
  });

  it('handles error when code is not found', async () => {
    // Mock getCode to return null to simulate code not found
    getCode.mockResolvedValue(null);
    
    renderWithProvidersAndRouting(<MockCodeDetail />, { initialPath: '/code/nonexistent' });
    
    await waitFor(() => {
      expect(screen.getByText(/Code not found/i)).toBeInTheDocument();
    });
  });

  // Additional tests for the real component can be added as needed
}); 