import { ApolloProvider } from '@apollo/client';
import { StrictMode, type JSX } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigate, NavLink, Route, BrowserRouter, Routes, type To } from 'react-router-dom';

import { apolloClient } from '@/lib/apollo-client';
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
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
        <h1 className="mt-2 text-lg font-bold text-slate-900">Sales Operations</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3" aria-label="Sales navigation">
        {navLinks.map(link => (
          <NavLink key={link.label} to={link.to} className={({ isActive }) => sidebarNavClass(isActive)}>
            <span
              className="grid h-6 w-6 place-items-center rounded-md bg-white/90 text-[14px] text-slate-500 group-hover:text-slate-700"
              aria-hidden="true"
            >
              {link.icon}
            </span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <footer className="border-t border-slate-200 px-4 py-3">
        <div className="rounded-md bg-white px-3 py-2 text-xs text-slate-500">Internal dashboard for operational triage.</div>
      </footer>
    </aside>
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
