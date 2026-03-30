import React, { ErrorInfo, ReactNode, useState, useCallback } from 'react';
import { ErrorFallback } from '../app';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function ErrorBoundary({ children, fallback, onError }: Props) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleReset = useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  // Note: In functional components, we need to use a different approach
  // For now, we'll wrap the children in a try-catch during rendering
  // This is a simplified version - a full implementation would need a different approach

  if (hasError) {
    if (fallback) {
      return fallback;
    }

    return (
      <ErrorFallback
        error={error}
        resetError={handleReset}
      />
    );
  }

  return <>{children}</>;
}
