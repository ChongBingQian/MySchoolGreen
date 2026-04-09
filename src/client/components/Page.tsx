/**
 * Page wrapper template to be used as a base for all pages.
 */

import React, { useEffect, useRef, useState } from 'react';
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
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 border-b border-[#4f5661] bg-[#2c3138]">
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

function Sidebar({
  isOpen,
  onClose,
  isDesktopExpanded,
  onDesktopEnter,
  onDesktopLeave,
}: {
  isOpen: boolean;
  onClose: () => void;
  isDesktopExpanded: boolean;
  onDesktopEnter: () => void;
  onDesktopLeave: () => void;
}) {
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
        onMouseEnter={onDesktopEnter}
        onMouseLeave={onDesktopLeave}
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#2c3138] border-r border-[#4f5661] transform transition-transform duration-200 ease-in-out lg:top-16 lg:bottom-0 lg:translate-x-0 lg:transform-none lg:transition-[width] lg:duration-300 lg:ease-out',
          isDesktopExpanded ? 'lg:w-64' : 'lg:w-20',
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
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors lg:px-3',
                  isDesktopExpanded ? 'lg:justify-start' : 'lg:justify-center',
                  isActive
                    ? 'bg-[#547599]/25 text-white lg:bg-[#547599]/35'
                    : 'text-[#c2cad4] hover:bg-[#343941] hover:text-white'
                )}
                title={link.label}
              >
                <Icon className="w-5 h-5" />
                <span
                  className={cn(
                    'lg:transition-all lg:duration-200 lg:ease-out',
                    isDesktopExpanded
                      ? 'lg:opacity-100 lg:translate-x-0 lg:static'
                      : 'lg:opacity-0 lg:-translate-x-1 lg:absolute lg:pointer-events-none'
                  )}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-full overflow-x-hidden pt-16">{children}</div>
  );
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
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(false);
  const collapseTimeoutRef = useRef<number | null>(null);

  const openDesktopSidebar = () => {
    if (collapseTimeoutRef.current !== null) {
      window.clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }

    setDesktopSidebarExpanded(true);
  };

  const closeDesktopSidebar = () => {
    if (collapseTimeoutRef.current !== null) {
      window.clearTimeout(collapseTimeoutRef.current);
    }

    collapseTimeoutRef.current = window.setTimeout(() => {
      setDesktopSidebarExpanded(false);
      collapseTimeoutRef.current = null;
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current !== null) {
        window.clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <PageWrapper>
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div
        className="hidden lg:block fixed left-0 top-16 bottom-0 w-8 z-40"
        onMouseEnter={openDesktopSidebar}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isDesktopExpanded={desktopSidebarExpanded}
          onDesktopEnter={openDesktopSidebar}
          onDesktopLeave={closeDesktopSidebar}
        />
        <PageBody className={className} isLoading={isLoading}>
          {children}
        </PageBody>
      </div>
    </PageWrapper>
  );
}
