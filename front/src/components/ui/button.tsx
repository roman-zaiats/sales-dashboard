import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const BASE_CLASS =
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const SIZE_CLASS: Record<ButtonSize, string> = {
  lg: 'h-11 px-6 text-base',
  md: 'h-10 px-4 text-sm',
  sm: 'h-9 px-3 text-sm',
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground',
  ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
  link: 'h-auto rounded-none bg-transparent p-0 text-primary underline-offset-4 hover:underline',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', ...props }, ref) => {
    const mergedClassName = `${BASE_CLASS} ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${className}`.trim();

    return <button ref={ref} className={mergedClassName} {...props} />;
  },
);

Button.displayName = 'Button';
