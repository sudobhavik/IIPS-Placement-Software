// frontend/src/routes/routeGuards.tsx
import React from "react";

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { ROUTES, USER_ROLES, ROUTE_META } from "../lib/constants";
import { USER_ROLES as USER_ROLES_TYPE } from "../lib/constants";
import type { UserRole } from "../lib/constants";

// ============================================================================
// RequireAuth - Redirects to login if not authenticated
// ============================================================================

interface RequireAuthProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return (
      fallback ?? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    // Store intended destination for post-login redirect
    const redirect = location.pathname + location.search;
    return <Navigate to={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return children ?? <Outlet />;
}

// ============================================================================
// RequireRole - Redirects to unauthorized if role not allowed
// ============================================================================

interface RequireRoleProps {
  roles: UserRole[];
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireRole({ roles, children, fallback }: RequireRoleProps) {
  const { role, isAuthenticated, isInitialized, isLoading } = useAuth();
  const location = useLocation();

  if (!isInitialized || isLoading) {
    return (
      fallback ?? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    const redirect = location.pathname + location.search;
    return <Navigate to={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (!role || !roles.includes(role)) {
    return fallback ?? <Navigate to={ROUTES.UNAUTHORIZED} replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}

// ============================================================================
// RequireStudent - Shorthand for student-only routes
// ============================================================================

export function RequireStudent({ children, fallback }: RequireAuthProps) {
  return <RequireRole roles={[USER_ROLES.STUDENT]}>{children}</RequireRole>;
}

// ============================================================================
// RequireAdmin - Shorthand for admin+ routes
// ============================================================================

export function RequireAdmin({ children, fallback }: RequireAuthProps) {
  return <RequireRole roles={[USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]}>{children}</RequireRole>;
}

// ============================================================================
// RequireSuperAdmin - Shorthand for super admin only routes
// ============================================================================

export function RequireSuperAdmin({ children, fallback }: RequireAuthProps) {
  return <RequireRole roles={[USER_ROLES.SUPER_ADMIN]}>{children}</RequireRole>;
}

// ============================================================================
// PublicOnly - Redirects authenticated users away from public pages
// ============================================================================

interface PublicOnlyProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function PublicOnly({ children, redirectTo = ROUTES.STUDENT_DASHBOARD }: PublicOnlyProps) {
  const { isAuthenticated, isInitialized, isLoading, role } = useAuth();

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Role-based redirect
    if (role === USER_ROLES.STUDENT) {
      return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />;
    }
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

// ============================================================================
// Route Guard HOC for Programmatic Protection
// ============================================================================

export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: UserRole[],
) {
  return function WithAuthGuard(props: P) {
    const { isAuthenticated, isInitialized, role } = useAuth();

    if (!isInitialized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
    }

    return <Component {...props} />;
  };
}

// ============================================================================
// Helper to Get Route Metadata
// ============================================================================

export function getRouteMeta(path: string) {
  // Exact match first
  if (ROUTE_META[path as keyof typeof ROUTE_META]) {
    return ROUTE_META[path as keyof typeof ROUTE_META];
  }

  // Check for parameterized routes
  for (const [route, meta] of Object.entries(ROUTE_META)) {
    const pattern = route.replace(/\{[^}]+\}/g, "[^/]+");
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(path)) {
      return meta;
    }
  }

  return null;
}

// ============================================================================
// Check if Path is Public
// ============================================================================

export function isPublicRoute(path: string): boolean {
  const meta = getRouteMeta(path);
  return meta?.public === true;
}

// ============================================================================
// Get Required Roles for Path
// ============================================================================

export function getRequiredRoles(path: string): UserRole[] | null {
  const meta = getRouteMeta(path);
  if (!meta || meta.public) return null;
  return (meta as { roles?: UserRole[] }).roles ?? null;
}
