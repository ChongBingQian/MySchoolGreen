import * as React from 'react';
import { cn } from '@/client/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          className="peer sr-only"
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            'h-4 w-4 shrink-0 rounded border border-[#4f5661] bg-[#2c3138] transition-colors',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#24282d]',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            'peer-checked:border-[#547599] peer-checked:bg-[#547599]',
            className
          )}
        >
          <Check
            className={cn(
              'h-3 w-3 text-white opacity-0 transition-opacity',
              'peer-checked:opacity-100'
            )}
            style={{ margin: '0.5px' }}
          />
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
