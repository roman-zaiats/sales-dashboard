import { ApolloProvider } from '@apollo/client';
import { StrictMode, type JSX } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigate, NavLink, Route, BrowserRouter, Routes, type To, useLocation } from 'react-router-dom';

import { apolloClient } from '@/lib/apollo-client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { DelayedSalesPage } from './dashboard/delayed/page';
import { SaleDetailPage } from './dashboard/sale/page';
import { SalesPage } from './dashboard/sales/page';
import './styles.css';

type NavLinkConfig = {
  to: To;
  label: string;
  icon: string;
};

type ExternalNavLinkConfig = {
  href: string;
  label: string;
  icon: string;
};

type NavSection = {
  title: string;
  links: (NavLinkConfig | ExternalNavLinkConfig)[];
};

const primaryNavLinks: NavSection[] = [
  {
    title: 'Navigation',
    links: [
      { to: '/dashboard/sales', label: 'Sales', icon: '📊' },
      { to: '/dashboard/delayed', label: 'Delayed', icon: '⏱️' },
    ],
  },
  {
    title: 'Reference',
    links: [
      {
        href: 'https://github.com/satnaing/shadcn-admin',
        label: 'Reference Dashboard',
        icon: '🧭',
      },
    ],
  },
];

const SalesSidebar = () => {
  const location = useLocation();

  const isActiveLink = (to: To): boolean => {
    const pathname = typeof to === 'string' ? to : to.pathname ?? '';
    if (!pathname) {
      return false;
    }

    return location.pathname === pathname || location.pathname.startsWith(`${pathname}/`);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className='px-4 py-4'>
        <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>Workspace</p>
        <p className='mt-2 text-xl font-semibold text-foreground'>Sales Operations</p>
      </SidebarHeader>

      <SidebarContent aria-label='Sales navigation'>
        {primaryNavLinks.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.links.map((link) =>
                  'to' in link ? (
                    <SidebarMenuItem key={link.label}>
                      <SidebarMenuButton asChild isActive={isActiveLink(link.to)}>
                        <NavLink to={link.to} aria-label={`Navigate to ${link.label}`}>
                          <span className="text-base" aria-hidden="true">
                            {link.icon}
                          </span>
                          <span className="truncate">{link.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : (
                    <SidebarMenuItem key={link.label}>
                      <SidebarMenuButton asChild>
                        <a
                          href={link.href}
                          rel="noreferrer"
                          target="_blank"
                          aria-label={`Open ${link.label}`}
                        >
                          <span className="text-base" aria-hidden="true">
                            {link.icon}
                          </span>
                          <span className="truncate">{link.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className='rounded-md border border-sidebar bg-[hsl(var(--sidebar-accent)/0.45)] px-3 py-2 text-xs text-sidebar-accent-foreground'>
          Real-time dashboard for operational sales triage.
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

const AppShellTopBar = () => {
  return (
    <header className='shadcn-topbar'>
      <div className='shadcn-topbar-inner'>
        <span className='text-sm font-semibold text-foreground'>Sales Dashboard</span>
        <span className='text-xs text-muted-foreground'>Operations</span>
      </div>
    </header>
  );
};

const AppFrame = (): JSX.Element => {
  return (
    <SidebarProvider>
      <SalesSidebar />
      <SidebarInset>
        <AppShellTopBar />
        <section className="w-full flex-1 px-4 py-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard/sales" replace />} />
            <Route path="/dashboard/sales" element={<SalesPage />} />
            <Route path="/dashboard/delayed" element={<DelayedSalesPage />} />
            <Route path="/dashboard/sale/:id" element={<SaleDetailPage />} />
          </Routes>
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
};

const App = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <AppFrame />
      </BrowserRouter>
    </ApolloProvider>
  );
};

const mountNode = document.getElementById('root');
if (!mountNode) {
  throw new Error('Unable to mount app: missing #root');
}

createRoot(mountNode).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
