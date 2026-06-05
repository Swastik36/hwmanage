import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
          // Variants
          {
            'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 hover:shadow-indigo-100': variant === 'primary',
            'bg-slate-100 text-slate-900 hover:bg-slate-200': variant === 'secondary',
            'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900': variant === 'outline',
            'hover:bg-slate-100 hover:text-slate-950 text-slate-600': variant === 'ghost',
            'text-indigo-600 underline-offset-4 hover:underline bg-transparent': variant === 'link',
            'bg-red-600 text-white shadow-sm hover:bg-red-500': variant === 'destructive',
          },
          // Sizes
          {
            'h-9 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
