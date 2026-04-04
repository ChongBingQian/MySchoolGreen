import { lazy } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouteObject,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import { useSession } from '@/client/lib/cloudflare/modelenceClient';

// For guest-only routes (login, signup) - redirects to home if already logged in
function GuestRoute() {
  const { user } = useSession();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const encodedRedirect = searchParams.get('_redirect');
  const redirect = encodedRedirect ? decodeURIComponent(encodedRedirect) : '/';

  if (user) {
    return <Navigate to={redirect} state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// For protected routes - redirects to login if not authenticated
function PrivateRoute() {
  const { user } = useSession();
  const location = useLocation();

  if (!user) {
    const fullPath = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?_redirect=${encodeURIComponent(fullPath)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}

// Public routes (no auth required)
const publicRoutes: RouteObject[] = [
  {
    path: '/',
    Component: lazy(() => import('./pages/HomePage')),
  },
  {
    path: '/example/:itemId',
    Component: lazy(() => import('./pages/ExamplePage')),
  },
  {
    path: '/terms',
    Component: lazy(() => import('./pages/TermsPage')),
  },
  {
    path: '/logout',
    Component: lazy(() => import('./pages/LogoutPage')),
  },
  {
    path: '*',
    Component: lazy(() => import('./pages/NotFoundPage')),
  },
];

// Guest routes (redirect to home if already logged in)
const guestRoutes: RouteObject[] = [
  {
    path: '/login',
    Component: lazy(() => import('./pages/LoginPage')),
  },
  {
    path: '/signup',
    Component: lazy(() => import('./pages/SignupPage')),
  },
];

// Private routes (redirect to login if not authenticated)
const privateRoutes: RouteObject[] = [
  {
    path: '/impact',
    Component: lazy(() => import('./pages/ImpactPage')),
  },
  {
    path: '/todos',
    Component: lazy(() => import('./pages/TodoPage')),
  },
  {
    path: '/example/private',
    Component: lazy(() => import('./pages/PrivateExamplePage')),
  },
  {
    path: '/dashboard',
    Component: lazy(() => import('./pages/DashboardPage')),
  },
  {
    path: '/devices',
    Component: lazy(() => import('./pages/DevicesPage')),
  },
  {
    path: '/simulator',
    Component: lazy(() => import('./pages/SensorSimulatorPage')),
  },
];

export const router = createBrowserRouter([
  ...publicRoutes,
  {
    Component: GuestRoute,
    children: guestRoutes,
  },
  {
    Component: PrivateRoute,
    children: privateRoutes,
  },
]);
