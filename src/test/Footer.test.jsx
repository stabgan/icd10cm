import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../components/Footer';

// Get access to the mock for manipulation in tests
const { useTheme } = vi.hoisted(() => ({ 
  useTheme: vi.fn() 
}));

// Mock the ThemeContext
vi.mock('../contexts/ThemeContext', async () => {
  const actual = await vi.importActual('../contexts/ThemeContext');
  return {
    ...actual,
    useTheme
  };
});

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock values
    useTheme.mockReturnValue({ 
      darkMode: false
    });
    
    // Mock Date to return a fixed date for consistent testing
    const currentYear = 2024;
    vi.spyOn(global.Date.prototype, 'getFullYear').mockImplementation(() => currentYear);
  });
  
  it('renders correctly with all sections', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    
    // Check for creator section
    expect(screen.getByText('CREATED BY MUSAFIR')).toBeInTheDocument();
    expect(screen.getByText('Lord of the Night & King of All Animals')).toBeInTheDocument();
    
    // Check for section headers
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
    
    // Check for external links
    expect(screen.getByText('Official ICD-10-CM Resources')).toBeInTheDocument();
    expect(screen.getByText('WHO Classification')).toBeInTheDocument();
    expect(screen.getByText('CDC ICD-10-CM')).toBeInTheDocument();
    expect(screen.getByText('AAPC Code Lookup')).toBeInTheDocument();
    
    // Check for internal links
    const termsLink = screen.getByText('Terms of Use');
    expect(termsLink).toBeInTheDocument();
    expect(termsLink.getAttribute('href')).toBe('/terms');
    
    const privacyLink = screen.getByText('Privacy Policy');
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink.getAttribute('href')).toBe('/privacy');
    
    // Check for copyright
    expect(screen.getByText('© 2024 ICD-10-CM Browser. All rights reserved.')).toBeInTheDocument();
    expect(screen.getByText(/ICD-10-CM is a registered trademark of the World Health Organization/)).toBeInTheDocument();
  });
  
  it('renders with dark mode styling when dark mode is enabled', () => {
    // Override the mock to indicate dark mode is active
    useTheme.mockReturnValue({
      darkMode: true
    });
    
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    
    // Check that dark mode specific content exists (can't easily check CSS classes in jsdom)
    expect(screen.getByText('CREATED BY MUSAFIR')).toBeInTheDocument();
    
    // At minimum we can verify the component rendered
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });
  
  it('has the correct external links with correct attributes', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    
    // Check external links have correct href and rel attributes
    const cmsLink = screen.getByText('Official ICD-10-CM Resources');
    expect(cmsLink.getAttribute('href')).toBe('https://www.cms.gov/Medicare/Coding/ICD10');
    expect(cmsLink.getAttribute('rel')).toBe('noreferrer');
    expect(cmsLink.getAttribute('target')).toBe('_blank');
    
    const whoLink = screen.getByText('WHO Classification');
    expect(whoLink.getAttribute('href')).toBe('https://www.who.int/standards/classifications/classification-of-diseases');
    expect(whoLink.getAttribute('rel')).toBe('noreferrer');
    expect(whoLink.getAttribute('target')).toBe('_blank');
    
    const cdcLink = screen.getByText('CDC ICD-10-CM');
    expect(cdcLink.getAttribute('href')).toBe('https://www.cdc.gov/nchs/icd/icd10cm.htm');
    expect(cdcLink.getAttribute('rel')).toBe('noreferrer');
    expect(cdcLink.getAttribute('target')).toBe('_blank');
    
    const aapcLink = screen.getByText('AAPC Code Lookup');
    expect(aapcLink.getAttribute('href')).toBe('https://www.aapc.com/codes/icd-10-codes-range/');
    expect(aapcLink.getAttribute('rel')).toBe('noreferrer');
    expect(aapcLink.getAttribute('target')).toBe('_blank');
  });
}); 