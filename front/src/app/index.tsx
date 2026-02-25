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
  `group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
    isActive
      ? 'bg-slate-900 text-white shadow-sm'
      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
  }`;

const SalesSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader>
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
        <h1 className="mt-2 text-lg font-bold text-slate-900">Sales Operations</h1>
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
                  className="grid h-6 w-6 place-items-center rounded-md bg-white/90 text-[14px] text-slate-500 group-hover:text-slate-700"
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
        <div className="rounded-md bg-white px-3 py-2 text-xs text-slate-500">Internal dashboard for operational triage.</div>
      </SidebarFooter>
    </Sidebar>
  );
};

const AppShellTopBar = () => {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="text-sm font-semibold text-slate-700">Sales Operations</div>
      <div className="text-xs text-slate-500">Dashboard</div>
    </header>
  );
};

const AppFrame = (): JSX.Element => {
  return (
    <div className="flex min-h-screen bg-slate-100">
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
