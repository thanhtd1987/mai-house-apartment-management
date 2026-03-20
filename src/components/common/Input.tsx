import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs font-bold text-gray-400 uppercase">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black',
            error && 'ring-2 ring-rose-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-rose-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
