import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const BASE_CLASS =
  'inline-flex items-center justify-center rounded-md font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 disabled:pointer-events-none disabled:opacity-50';

const SIZE_CLASS: Record<ButtonSize, string> = {
  lg: 'h-11 px-6 text-base',
  md: 'h-10 px-4 text-sm',
  sm: 'h-8 px-3 text-sm',
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: 'bg-slate-900 text-white hover:bg-slate-800',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  link: 'h-auto rounded-none bg-transparent p-0 text-sky-700 underline-offset-4 hover:underline',
  outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', ...props }, ref) => {
    const mergedClassName = `${BASE_CLASS} ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${className}`.trim();

    return <button ref={ref} className={mergedClassName} {...props} />;
  },
);

Button.displayName = 'Button';
