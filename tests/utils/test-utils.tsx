/**
 * Testing utilities and custom render function
 * Provides common test setup with providers and mocks
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/contexts/language-context';
import { Router } from 'wouter';
import { Toaster } from '@/components/ui/toaster';

// Custom render function that includes common providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Mock window.location for wouter router
  delete (window as any).location;
  window.location = {
    ...window.location,
    pathname: initialRoute,
    search: '',
    hash: '',
  } as Location;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <Router>
            {children}
            <Toaster />
          </Router>
        </LanguageProvider>
      </QueryClientProvider>
    );
  }

  return { 
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient 
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Custom matchers and utilities
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

/**
 * Creates a mock family member for testing
 */
export function createMockFamilyMember(overrides = {}) {
  return {
    id: 'test-id',
    externalId: 'test-external-id',
    name: 'Test Person',
    born: 1900,
    died: 1980,
    biologicalSex: 'Male',
    notes: 'Test notes',
    father: null,
    ageAtDeath: 80,
    diedYoung: false,
    isSuccessionSon: false,
    hasMaleChildren: false,
    nobleBranch: null,
    monarchDuringLife: ['Test Monarch'],
    importedAt: '2024-07-24T20:00:00.000Z',
    importSource: 'test',
    ...overrides,
  };
}

/**
 * Simulates user typing with realistic delays
 */
export async function typeWithDelay(element: HTMLElement, text: string, delay = 50) {
  const { default: userEventLib } = await import('@testing-library/user-event');
  const user = userEventLib.setup({ delay });
  await user.type(element, text);
}

/**
 * Waits for a specific element to appear in the DOM
 */
export function waitForElement(selector: string, timeout = 5000) {
  return new Promise<Element>((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}