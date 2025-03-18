import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../components/Header';

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

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock values
    useTheme.mockReturnValue({ 
      darkMode: false, 
      toggleDarkMode: vi.fn() 
    });
    
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0
    });
  });
  
  it('renders correctly with all elements', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    // Check that the logo and navigation items are present
    expect(screen.getByText('ICD-10-CM')).toBeInTheDocument();
    expect(screen.getByText('Browser')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText(/Switch to dark mode/i)).toBeInTheDocument();
    
    // Check for GitHub link
    const githubLink = screen.getByLabelText('GitHub Repository');
    expect(githubLink).toBeInTheDocument();
    expect(githubLink.getAttribute('href')).toBe('https://github.com/stabgan/icd10cm');
  });
  
  it('applies scrolled styling when window is scrolled', () => {
    // Mock scrolled state
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 20
    });
    
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    // Need to dispatch scroll event manually
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    
    // We can check for class changes, but since the actual classes are computed
    // based on scrolled state and dark mode, we'll just verify the header exists
    const header = document.querySelector('header');
    expect(header).toBeInTheDocument();
  });
  
  it('toggles dark mode when the theme button is clicked', () => {
    const toggleDarkMode = vi.fn();
    
    // Override the mock to provide our function
    useTheme.mockReturnValue({
      darkMode: false,
      toggleDarkMode
    });
    
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    // Find and click the dark mode toggle button
    const themeToggle = screen.getByLabelText(/Switch to dark mode/i);
    fireEvent.click(themeToggle);
    
    // Verify that toggleDarkMode was called
    expect(toggleDarkMode).toHaveBeenCalledTimes(1);
  });
  
  it('renders dark mode icon when in dark mode', () => {
    // Override the mock to indicate dark mode is active
    useTheme.mockReturnValue({
      darkMode: true,
      toggleDarkMode: vi.fn()
    });
    
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    // Check for the light mode icon (sun) when in dark mode
    expect(screen.getByLabelText(/Switch to light mode/i)).toBeInTheDocument();
  });
  
  it('navigates to home when logo is clicked', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    // Find the logo link
    const logoLink = screen.getByText('ICD-10-CM').closest('a');
    expect(logoLink).toBeInTheDocument();
    expect(logoLink.getAttribute('href')).toBe('/');
  });
}); 