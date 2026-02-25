import { type HTMLAttributes, forwardRef } from 'react';

export const Sidebar = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(({ className = '', ...props }, ref) => (
  <aside ref={ref} className={`sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 shadow-sm ${className}`.trim()} {...props} />
));

Sidebar.displayName = 'Sidebar';

export const SidebarHeader = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(({ className = '', ...props }, ref) => (
  <header ref={ref} className={`border-b border-slate-200 px-4 py-4 ${className}`.trim()} {...props} />
));

SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(({ className = '', ...props }, ref) => (
  <section ref={ref} className={`flex-1 space-y-1 px-3 py-3 ${className}`.trim()} {...props} />
));

SidebarContent.displayName = 'SidebarContent';

export const SidebarFooter = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(({ className = '', ...props }, ref) => (
  <footer ref={ref} className={`border-t border-slate-200 px-4 py-3 ${className}`.trim()} {...props} />
));

SidebarFooter.displayName = 'SidebarFooter';

export const SidebarMenu = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(({ className = '', ...props }, ref) => (
  <ul ref={ref} className={`space-y-1 ${className}`.trim()} {...props} />
));

SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(({ className = '', ...props }, ref) => (
  <li ref={ref} className={`${className}`.trim()} {...props} />
));

SidebarMenuItem.displayName = 'SidebarMenuItem';
