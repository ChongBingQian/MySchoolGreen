/**
 * Page wrapper template to be used as a base for all pages.
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  return (
    <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 border-b border-[#4f5661] bg-[#2c3138]">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <Link to="/">
          <Button variant="ghost">Home</Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-[#c2cad4]">MySchoolGreen</span>
      </div>
    </header>
  );
}

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();

  const navLinks: NavLink[] = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/impact', label: 'Impact Summary', icon: TrendingUp },
    { to: '/devices', label: 'Devices', icon: Smartphone },
    { to: '/simulator', label: 'Sensor Simulator', icon: Leaf },
    { to: '/todos', label: 'Todo List', icon: CheckSquare },
  ];

  if (navLinks.length === 0) {
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
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#2c3138] border-r border-[#4f5661] transform transition-transform duration-200 ease-in-out lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-20 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#4f5661] lg:hidden">
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
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all lg:justify-center lg:px-0',
                  isActive
                    ? 'bg-[#547599]/25 text-white lg:bg-[#547599]/35'
                    : 'text-[#c2cad4] hover:bg-[#343941] hover:text-white'
                )}
                title={link.label}
              >
                <Icon className="w-5 h-5" />
                <span className="lg:sr-only">{link.label}</span>
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
    <div className="flex flex-1 w-full min-h-0 lg:pl-20">
      <main
        className={cn(
          'flex flex-col flex-1 p-4 space-y-4 overflow-x-hidden bg-gradient-to-br from-[#24282d] via-[#2c3138] to-[#343941]',
          className
        )}
      >
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

  return (
    <PageWrapper>
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-0">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <PageBody className={className} isLoading={isLoading}>
          {children}
        </PageBody>
      </div>
    </PageWrapper>
  );
}
