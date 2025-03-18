import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme, ThemeContext } from '../../contexts/ThemeContext';
import React, { useContext } from 'react';

// Mock local storage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    getAll: () => store
  };
})();

// Mock window.matchMedia
const mockMatchMedia = vi.fn().mockImplementation((query) => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}));

// Test component to consume theme context
const TestComponent = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <div>
      <div data-testid="theme-value">{darkMode ? 'dark' : 'light'}</div>
      <button onClick={toggleDarkMode} data-testid="toggle-button">
        Toggle Theme
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage
    });
    
    // Mock matchMedia
    window.matchMedia = mockMatchMedia;
    
    // Clear mock local storage
    mockLocalStorage.clear();
  });
  
  it('provides default theme as light when no preference is set', () => {
    // Mock matchMedia to return no dark mode preference
    window.matchMedia.mockImplementationOnce(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });
  
  it('uses system preference (dark) when available and no localStorage value', () => {
    // Mock matchMedia to return dark mode preference
    window.matchMedia.mockImplementationOnce(() => ({
      matches: true, // System prefers dark mode
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });
  
  it('respects localStorage theme preference over system preference', () => {
    // Set localStorage preference to light
    mockLocalStorage.getItem.mockReturnValueOnce('false'); // darkMode: false = light theme
    
    // Mock system preference as dark
    window.matchMedia.mockImplementationOnce(() => ({
      matches: true, // System prefers dark mode
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Should use localStorage preference (light) despite system preferring dark
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });
  
  it('toggles theme when toggle function is called', () => {
    // Start with light theme
    window.matchMedia.mockImplementation(() => ({
      matches: false, // light theme
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Initial theme
    const initialTheme = screen.getByTestId('theme-value').textContent;
    expect(initialTheme).toBe('light');
    
    // Toggle theme
    fireEvent.click(screen.getByTestId('toggle-button'));
    
    // New theme should be different
    const newTheme = screen.getByTestId('theme-value').textContent;
    expect(newTheme).toBe('dark');
    
    // Toggle should also update localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('darkMode', 'true');
  });
  
  it('applies theme class to html element when theme changes', () => {
    // Save original document.documentElement.classList
    const originalClassList = document.documentElement.classList;
    
    // Replace with mock classList
    const mockClassList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false)
    };
    
    Object.defineProperty(document.documentElement, 'classList', {
      value: mockClassList,
      configurable: true
    });
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Toggle theme to dark
    fireEvent.click(screen.getByTestId('toggle-button'));
    
    // Should add dark class
    expect(mockClassList.add).toHaveBeenCalledWith('dark');
    
    // Restore original classList
    Object.defineProperty(document.documentElement, 'classList', {
      value: originalClassList,
      configurable: true
    });
  });
  
  it('can be consumed using the useTheme hook', () => {
    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Check that hook provides darkMode value and toggle function
    expect(result.current.darkMode !== undefined).toBe(true);
    expect(typeof result.current.toggleDarkMode).toBe('function');
    
    // Toggle theme
    act(() => {
      result.current.toggleDarkMode();
    });
    
    // Theme should have toggled
    expect(result.current.darkMode).toBe(true);
  });
  
  it('provides context that can be consumed directly with useContext', () => {
    const TestWithUseContext = () => {
      const themeContext = useContext(ThemeContext);
      return (
        <div>
          <div data-testid="direct-theme-value">{themeContext.darkMode ? 'dark' : 'light'}</div>
          <button 
            onClick={themeContext.toggleDarkMode} 
            data-testid="direct-toggle-button"
          >
            Toggle
          </button>
        </div>
      );
    };
    
    render(
      <ThemeProvider>
        <TestWithUseContext />
      </ThemeProvider>
    );
    
    // Should provide theme through context
    expect(screen.getByTestId('direct-theme-value').textContent).toBeDefined();
    
    // Toggle using context function
    fireEvent.click(screen.getByTestId('direct-toggle-button'));
    
    // localStorage should be updated
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });
  
  it('applies document theme class on initial render', () => {
    // Save original document.documentElement.classList
    const originalClassList = document.documentElement.classList;
    
    // Replace with mock classList
    const mockClassList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false)
    };
    
    Object.defineProperty(document.documentElement, 'classList', {
      value: mockClassList,
      configurable: true
    });
    
    // Mock dark mode preference
    window.matchMedia.mockImplementationOnce(() => ({
      matches: true,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Should add dark theme class
    expect(mockClassList.add).toHaveBeenCalledWith('dark');
    
    // Restore original classList
    Object.defineProperty(document.documentElement, 'classList', {
      value: originalClassList,
      configurable: true
    });
  });
}); 