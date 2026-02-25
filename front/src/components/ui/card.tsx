import { type HTMLAttributes, forwardRef } from 'react';

const baseClass = 'rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }, ref) => (
  <article ref={ref} className={`${baseClass} ${className}`.trim()} {...props} />
));

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => <div ref={ref} className={`space-y-1 px-3 py-2 ${className}`.trim()} {...props} />,
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => <h4 ref={ref} className={`text-sm font-semibold ${className}`.trim()} {...props} />,
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => <p ref={ref} className={`text-xs text-slate-500 ${className}`.trim()} {...props} />,
);

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => <div ref={ref} className={`${className}`.trim()} {...props} />,
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => <div ref={ref} className={`px-3 py-2 ${className}`.trim()} {...props} />,
);

CardFooter.displayName = 'CardFooter';
