/**
 * Page wrapper template to be used as a base for all pages.
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSession } from '@/client/lib/cloudflare/modelenceClient';
import LoadingSpinner from '@/client/components/LoadingSpinner';
import { Button } from '@/client/components/ui/Button';
import { cn } from '@/client/lib/utils';
import { Home, BarChart3, Smartphone, Leaf, CheckSquare, Menu, X, TrendingUp } from 'lucide-react';

interface PageProps {
  children?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

interface NavLink {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useSession();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <Link to="/">
          <Button variant="ghost">Home</Button>
        </Link>
      </div>

      {user ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.handle}</span>
          <Link to="/logout">
            <Button variant="outline">Logout</Button>
          </Link>
        </div>
      ) : (
        <Link to="/login">
          <Button variant="outline">Sign in</Button>
        </Link>
      )}
    </header>
  );
}

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useSession();
  const location = useLocation();

  const navLinks: NavLink[] = user
    ? [
        { to: '/', label: 'Home', icon: Home },
        { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
        { to: '/impact', label: 'Impact Summary', icon: TrendingUp },
        { to: '/devices', label: 'Devices', icon: Smartphone },
        { to: '/simulator', label: 'Sensor Simulator', icon: Leaf },
        { to: '/todos', label: 'Todo List', icon: CheckSquare },
      ]
    : [];

  if (!user || navLinks.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col min-h-screen max-w-full overflow-x-hidden">{children}</div>;
}

function PageBody({ children, className, isLoading = false }: PageProps) {
  return (
    <div className="flex flex-1 w-full min-h-0">
      <main className={cn('flex flex-col flex-1 p-4 space-y-4 overflow-x-hidden', className)}>
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <LoadingSpinner />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

export default function Page({ children, className, isLoading = false }: PageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSession();

  return (
    <PageWrapper>
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-0">
        {user && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <PageBody className={className} isLoading={isLoading}>
          {children}
        </PageBody>
      </div>
    </PageWrapper>
  );
}
