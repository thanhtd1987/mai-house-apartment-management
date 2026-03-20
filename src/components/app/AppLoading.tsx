import React from 'react';
import { Loader2 } from 'lucide-react';

export function AppLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
        <p className="text-sm text-gray-600">Đang tải...</p>
      </div>
    </div>
  );
}
