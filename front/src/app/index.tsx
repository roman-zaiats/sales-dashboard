import { ApolloProvider } from '@apollo/client';
import { StrictMode, type JSX } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigate, NavLink, Route, BrowserRouter, Routes, type To } from 'react-router-dom';

import { apolloClient } from '@/lib/apollo-client';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { DelayedSalesPage } from './dashboard/delayed/page';
import { SaleDetailPage } from './dashboard/sale/page';
import { SalesPage } from './dashboard/sales/page';
import './styles.css';

type NavLinkConfig = {
  to: To;
  label: string;
  icon: string;
};

const navLinks: NavLinkConfig[] = [
  { to: '/dashboard/sales', label: 'Sales', icon: '🧾' },
  { to: '/dashboard/delayed', label: 'Delayed', icon: '⏰' },
];

const sidebarNavClass = (isActive: boolean): string =>
  `shadcn-sidebar-link ${
    isActive
      ? 'shadcn-sidebar-link-active'
      : 'shadcn-sidebar-link-inactive'
  }`;

const SalesSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
        <h1 className="mt-2 text-lg font-semibold">Sales Operations</h1>
      </SidebarHeader>

      <SidebarContent aria-label="Sales navigation">
        <SidebarMenu>
          {navLinks.map(link => (
            <SidebarMenuItem key={link.label}>
              <NavLink
                to={link.to}
                className={({ isActive }) => sidebarNavClass(isActive)}
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-md bg-sidebar-accent text-[14px] text-sidebar-accent-foreground"
                  aria-hidden="true"
                >
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </NavLink>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-md border border-sidebar bg-sidebar-accent px-3 py-2 text-xs text-sidebar-accent-foreground">
          Operational sales triage dashboard.
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

const AppShellTopBar = () => {
    return (
    <header className="sticky top-0 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 backdrop-blur">
      <div className="text-sm font-semibold">Sales Operations</div>
      <div className="text-xs text-muted-foreground">Dashboard</div>
    </header>
  );
};

const AppFrame = (): JSX.Element => {
  return (
    <div className="flex min-h-screen bg-muted">
      <SalesSidebar />
      <main className="min-h-screen flex-1">
        <AppShellTopBar />
        <section className="p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard/sales" replace />} />
              <Route path="/dashboard/sales" element={<SalesPage />} />
              <Route path="/dashboard/delayed" element={<DelayedSalesPage />} />
              <Route path="/dashboard/sale/:id" element={<SaleDetailPage />} />
            </Routes>
          </div>
        </section>
      </main>
    </div>
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
