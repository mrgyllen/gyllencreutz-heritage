/**
 * Error Boundary components for graceful error handling in React components
 * 
 * Provides fallback UI when components fail to render and logs errors
 * for debugging while maintaining a good user experience.
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { handleError, ErrorSeverity, createErrorContext, type AppError } from '@/lib/errors';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
  component?: string;
}

/**
 * Generic Error Boundary component for catching and handling React component errors
 * 
 * Wraps child components and provides a fallback UI when errors occur.
 * Automatically logs errors using the standardized error handling system.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error using standardized error handling
    const context = createErrorContext(this.props.component, 'component_render');
    handleError(error, context, ErrorSeverity.HIGH, false);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="max-w-lg mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                We encountered an unexpected error. This has been logged and our team will investigate.
              </AlertDescription>
            </Alert>
            
            {this.props.showErrorDetails && this.state.error && (
              <details className="text-sm text-gray-600">
                <summary className="cursor-pointer font-medium">Technical Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2">
              <Button onClick={this.handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Specialized Error Boundary for the Admin interface
 * 
 * Provides admin-specific error handling with additional context
 * and recovery options for administrative operations.
 */
export function AdminErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      component="AdminInterface"
      showErrorDetails={true}
      fallback={
        <div className="container mx-auto p-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Admin Interface Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  The admin interface encountered an error. Please try refreshing the page or contact support if the issue persists.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Return to Heritage Site
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Specialized Error Boundary for the Family Tree visualization
 * 
 * Handles D3.js and complex visualization errors gracefully
 * while preserving the rest of the application functionality.
 */
export function FamilyTreeErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      component="FamilyTree"
      fallback={
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Family Tree Unavailable
          </h3>
          <p className="text-gray-600 mb-4">
            The family tree visualization could not be loaded. The data is still available in list format below.
          </p>
          <Button onClick={() => window.location.reload()} className="flex items-center gap-2 mx-auto">
            <RefreshCw className="h-4 w-4" />
            Reload Tree
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Hook for programmatic error reporting within functional components
 * 
 * @param component - Name of the component for error context
 * @returns Function to report errors with context
 */
export function useErrorHandler(component?: string) {
  return React.useCallback((error: unknown, action?: string) => {
    const context = createErrorContext(component, action);
    handleError(error, context, ErrorSeverity.MEDIUM, true);
  }, [component]);
}

/**
 * Higher-order component for wrapping components with error boundaries
 * 
 * @param WrappedComponent - Component to wrap with error boundary
 * @param options - Error boundary configuration options
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    component?: string;
    showErrorDetails?: boolean;
  }
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary
      fallback={options?.fallback}
      component={options?.component || WrappedComponent.name}
      showErrorDetails={options?.showErrorDetails}
    >
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundaryComponent;
}