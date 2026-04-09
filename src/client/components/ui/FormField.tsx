import * as React from 'react';
import { cn } from '@/client/lib/utils';
import { Label } from './Label';

export interface FormFieldProps {
  label?: string;
  error?: string;
  description?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, description, required, htmlFor, className, children }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={htmlFor} className="block">
            {label}
            {required && <span className="text-[#69503b] ml-1">*</span>}
          </Label>
        )}
        {children}
        {description && !error && <p className="text-sm text-[#98a4b2]">{description}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

export { FormField };
