import * as React from 'react';
import { cn } from '@/client/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            'flex h-9 w-full appearance-none rounded-md border border-[#4f5661] bg-[#2c3138] px-3 py-1 pr-8 text-sm text-[#edf1f5] shadow-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#24282d]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a4b2] pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface SelectOptionProps extends React.OptionHTMLAttributes<HTMLOptionElement> {}

const SelectOption = React.forwardRef<HTMLOptionElement, SelectOptionProps>(
  ({ className, ...props }, ref) => {
    return <option className={cn(className)} ref={ref} {...props} />;
  }
);
SelectOption.displayName = 'SelectOption';

export { Select, SelectOption };
