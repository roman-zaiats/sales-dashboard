import { type HTMLAttributes, forwardRef } from 'react';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }, ref) => (
  <article
    ref={ref}
    className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm ${className}`.trim()}
    {...props}
  />
));

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 p-4 ${className}`.trim()} {...props} />
  ),
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => <h4 ref={ref} className={`text-sm font-semibold leading-none tracking-tight ${className}`.trim()} {...props} />,
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => <p ref={ref} className={`text-sm text-muted-foreground ${className}`.trim()} {...props} />,
);

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => <div ref={ref} className={`${className}`.trim()} {...props} />,
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => <div ref={ref} className={`p-4 pt-0 ${className}`.trim()} {...props} />,
);

CardFooter.displayName = 'CardFooter';
