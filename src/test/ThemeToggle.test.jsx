import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../components/ThemeToggle';

// Mock the ThemeContext
vi.mock('../contexts/ThemeContext', () => {
  const mockUseTheme = vi.fn().mockReturnValue({ 
    darkMode: false, 
    toggleDarkMode: vi.fn() 
  });
  
  return {
    useTheme: mockUseTheme
  };
});

// Get access to the mock for manipulation in tests
const { useTheme } = vi.hoisted(() => ({ 
  useTheme: vi.fn() 
}));

// Update the mock implementation
vi.mock('../contexts/ThemeContext', async () => {
  const actual = await vi.importActual('../contexts/ThemeContext');
  return {
    ...actual,
    useTheme
  };
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTheme.mockReturnValue({ 
      darkMode: false, 
      toggleDarkMode: vi.fn() 
    });
  });
  
  it('renders correctly in light mode', () => {
    render(<ThemeToggle />);
    
    // Check for the button
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
    
    // Check for the correct aria-label
    expect(toggleButton).toHaveAttribute('aria-label', 'Switch to dark mode');
    
    // Check that the moon icon is rendered (light mode - shows moon)
    const svg = toggleButton.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('text-gray-700');
  });
  
  it('renders correctly in dark mode', () => {
    // Override the mock to indicate dark mode is active
    useTheme.mockReturnValue({
      darkMode: true,
      toggleDarkMode: vi.fn()
    });
    
    render(<ThemeToggle />);
    
    // Check for the button
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
    
    // Check for the correct aria-label
    expect(toggleButton).toHaveAttribute('aria-label', 'Switch to light mode');
    
    // Check that the sun icon is rendered (dark mode - shows sun)
    const svg = toggleButton.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('text-yellow-400');
  });
  
  it('calls toggleDarkMode when clicked', () => {
    // Setup a mock for toggleDarkMode
    const toggleDarkMode = vi.fn();
    useTheme.mockReturnValue({
      darkMode: false,
      toggleDarkMode
    });
    
    render(<ThemeToggle />);
    
    // Find and click the toggle button
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // Verify toggleDarkMode was called
    expect(toggleDarkMode).toHaveBeenCalledTimes(1);
  });
  
  it('has the correct accessibility attributes', () => {
    render(<ThemeToggle />);
    
    // Check for proper accessibility attributes
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveAttribute('aria-label', 'Switch to dark mode');
    
    // Change to dark mode
    useTheme.mockReturnValue({
      darkMode: true,
      toggleDarkMode: vi.fn()
    });
    
    // Re-render with dark mode
    render(<ThemeToggle />);
    
    // Check that aria-label updates
    const darkModeButton = screen.getAllByRole('button')[1]; // Get the new button
    expect(darkModeButton).toHaveAttribute('aria-label', 'Switch to light mode');
  });
}); 