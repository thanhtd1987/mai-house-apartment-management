import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../common';

interface ErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Có lỗi xảy ra</h1>
        <p className="text-gray-600 mb-6">
          {error?.message || 'Ứng dụng gặp lỗi không xác định. Vui lòng thử lại.'}
        </p>

        {resetError && (
          <Button onClick={resetError} icon={<RefreshCw size={18} />}>
            Thử lại
          </Button>
        )}
      </div>
    </div>
  );
}
