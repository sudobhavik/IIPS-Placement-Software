// frontend/src/routes/routeConfig.ts
import { lazy, ComponentType } from "react";
import { ROUTES, USER_ROLES, SIDEBAR_ITEMS, SidebarItem } from "../lib/constants";
import type { UserRole } from "../lib/constants";

// ============================================================================
// Lazy-loaded Page Components
// ============================================================================

// Auth pages (public)
const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const ActivationPage = lazy(() => import("../features/auth/ActivationPage"));
const ChangePasswordPage = lazy(() => import("../features/auth/ChangePasswordPage"));
const ForgotPasswordPage = lazy(() => import("../features/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../features/auth/ResetPasswordPage"));

// Error pages
const UnauthorizedPage = lazy(() => import("../pages/Unauthorized"));
const NotFoundPage = lazy(() => import("../pages/NotFound"));

// Student pages
const StudentDashboard = lazy(() => import("../features/student/StudentDashboard"));
const StudentProfilePage = lazy(() => import("../features/student/StudentProfilePage"));
const StudentAcademicsPage = lazy(() => import("../features/student/StudentAcademicsPage"));

// Admin pages
const AdminDashboard = lazy(() => import("../features/admin/AdminDashboard"));
const StudentListPage = lazy(() => import("../features/admin/StudentListPage"));
const ImportPage = lazy(() => import("../features/imports/ImportPage"));

// ============================================================================
// Route Configuration Type
// ============================================================================

export interface RouteConfig {
  path: string;
  element: ComponentType<unknown> | null; // null for layout routes
  children?: RouteConfig[];
  roles?: UserRole[];
  public?: boolean;
  layout?: "auth" | "app" | "public";
  title?: string;
  icon?: string;
  hidden?: boolean; // Hidden from sidebar but accessible
}

// ============================================================================
// Public Routes (no auth required)
// ============================================================================

export const publicRoutes: RouteConfig[] = [
  {
    path: ROUTES.LOGIN,
    element: LoginPage,
    public: true,
    layout: "auth",
    title: "Login",
  },
  {
    path: ROUTES.ACTIVATION,
    element: ActivationPage,
    public: true,
    layout: "auth",
    title: "Activate Account",
  },
  {
    path: ROUTES.CHANGE_PASSWORD,
    element: ChangePasswordPage,
    roles: [USER_ROLES.STUDENT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    layout: "app",
    title: "Change Password",
    hidden: true, // Not in sidebar
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: ForgotPasswordPage,
    public: true,
    layout: "auth",
    title: "Forgot Password",
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: ResetPasswordPage,
    public: true,
    layout: "auth",
    title: "Reset Password",
  },
  {
    path: ROUTES.UNAUTHORIZED,
    element: UnauthorizedPage,
    public: true,
    layout: "public",
    title: "Unauthorized",
  },
  {
    path: ROUTES.NOT_FOUND,
    element: NotFoundPage,
    public: true,
    layout: "public",
    title: "Not Found",
  },
];

// ============================================================================
// Student Routes (authenticated, student role)
// ============================================================================

export const studentRoutes: RouteConfig[] = [
  {
    path: ROUTES.STUDENT_DASHBOARD,
    element: StudentDashboard,
    roles: [USER_ROLES.STUDENT],
    layout: "app",
    title: "Dashboard",
    icon: "layout-dashboard",
  },
  {
    path: ROUTES.STUDENT_PROFILE,
    element: StudentProfilePage,
    roles: [USER_ROLES.STUDENT],
    layout: "app",
    title: "Profile",
    icon: "user",
  },
  {
    path: ROUTES.STUDENT_ACADEMICS,
    element: StudentAcademicsPage,
    roles: [USER_ROLES.STUDENT],
    layout: "app",
    title: "Academics",
    icon: "graduation-cap",
  },
];

// ============================================================================
// Admin Routes (authenticated, admin+ role)
// ============================================================================

export const adminRoutes: RouteConfig[] = [
  {
    path: ROUTES.ADMIN_DASHBOARD,
    element: AdminDashboard,
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    layout: "app",
    title: "Dashboard",
    icon: "layout-dashboard",
  },
  {
    path: ROUTES.ADMIN_STUDENTS,
    element: StudentListPage,
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    layout: "app",
    title: "Students",
    icon: "users",
  },
  {
    path: ROUTES.ADMIN_IMPORTS,
    element: ImportPage,
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    layout: "app",
    title: "Imports",
    icon: "upload",
  },
];

// ============================================================================
// All Routes Combined
// ============================================================================

export const allRoutes: RouteConfig[] = [...publicRoutes, ...studentRoutes, ...adminRoutes];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get routes for a specific role (for sidebar generation)
 */
export function getRoutesForRole(role: UserRole): RouteConfig[] {
  const baseRoutes = publicRoutes.filter((r) => !r.hidden);

  if (role === USER_ROLES.STUDENT) {
    return [...baseRoutes, ...studentRoutes];
  }

  if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) {
    return [...baseRoutes, ...adminRoutes];
  }

  return baseRoutes;
}

/**
 * Get sidebar items for a role
 */
export function getSidebarItemsForRole(role: UserRole): SidebarItem[] {
  return SIDEBAR_ITEMS[role] || [];
}

/**
 * Find route config by path
 */
export function findRouteByPath(path: string): RouteConfig | null {
  for (const route of allRoutes) {
    if (route.path === path) return route;
    if (route.children) {
      const found = findRouteInChildren(route.children, path);
      if (found) return found;
    }
  }
  return null;
}

function findRouteInChildren(children: RouteConfig[], path: string): RouteConfig | null {
  for (const route of children) {
    if (route.path === path) return route;
    if (route.children) {
      const found = findRouteInChildren(route.children, path);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get page title for a path
 */
export function getPageTitle(path: string): string {
  const route = findRouteByPath(path);
  return route?.title || "PlaceIQ";
}

/**
 * Check if route requires authentication
 */
export function routeRequiresAuth(path: string): boolean {
  const route = findRouteByPath(path);
  return !route?.public;
}

/**
 * Check if route is accessible by role
 */
export function canAccessRoute(path: string, role: UserRole | null): boolean {
  const route = findRouteByPath(path);
  if (!route) return false;
  if (route.public) return true;
  if (!role) return false;
  if (!route.roles) return true;
  return route.roles.includes(role);
}

/**
 * Get default redirect path for role
 */
export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case USER_ROLES.STUDENT:
      return ROUTES.STUDENT_DASHBOARD;
    case USER_ROLES.ADMIN:
    case USER_ROLES.SUPER_ADMIN:
      return ROUTES.ADMIN_DASHBOARD;
    default:
      return ROUTES.LOGIN;
  }
}

/**
 * Get breadcrumb trail for a path
 */
export function getBreadcrumbs(path: string): Array<{ label: string; path: string }> {
  const breadcrumbs: Array<{ label: string; path: string }> = [];
  const segments = path.split("/").filter(Boolean);
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const route = findRouteByPath(currentPath);
    if (route && route.title) {
      breadcrumbs.push({ label: route.title, path: currentPath });
    }
  }

  return breadcrumbs;
}
