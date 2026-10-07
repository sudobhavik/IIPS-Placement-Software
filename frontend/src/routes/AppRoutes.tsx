// frontend/src/routes/AppRoutes.tsx
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "../features/auth/useAuth";
import { RequireAuth, RequireRole, PublicOnly } from "./routeGuards";
import { ROUTES } from "../lib/constants";

// ============================================================================
// Layout Components (lazy loaded)
// ============================================================================

const AuthLayout = lazy(() => import("../components/layout/AuthLayout"));
const AppLayout = lazy(() => import("../components/layout/AppLayout"));
const PublicLayout = lazy(() => import("../components/layout/PublicLayout"));

// ============================================================================
// Page Components (lazy loaded)
// ============================================================================

const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const ActivationPage = lazy(() => import("../features/auth/ActivationPage"));
const ChangePasswordPage = lazy(() => import("../features/auth/ChangePasswordPage"));
const ForgotPasswordPage = lazy(() => import("../features/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../features/auth/ResetPasswordPage"));
const UnauthorizedPage = lazy(() => import("../pages/Unauthorized"));
const NotFoundPage = lazy(() => import("../pages/NotFound"));
const StudentDashboard = lazy(() => import("../features/student/StudentDashboard"));
const StudentProfilePage = lazy(() => import("../features/student/StudentProfilePage"));
const StudentAcademicsPage = lazy(() => import("../features/student/StudentAcademicsPage"));
const AdminDashboard = lazy(() => import("../features/admin/AdminDashboard"));
const StudentListPage = lazy(() => import("../features/admin/StudentListPage"));
const ImportPage = lazy(() => import("../features/imports/ImportPage"));

// ============================================================================
// Loading Fallbacks
// ============================================================================

const LayoutFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
  </div>
);

const PageFallback = () => (
  <div className="p-6 animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
  </div>
);

// ============================================================================
// Wrapper Components with Outlet for nested routes
// ============================================================================

function RequireStudentWrapper() {
  return (
    <RequireRole roles={["student"]}>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </RequireRole>
  );
}

function RequireAdminWrapper() {
  return (
    <RequireRole roles={["admin", "super_admin"]}>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </RequireRole>
  );
}

function WithSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

// ============================================================================
// Main App Routes Component
// ============================================================================

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ================================================================
              Auth Routes (Auth Layout) - /login, /activate, etc.
              ================================================================ */}
          <Route
            element={
              <Suspense fallback={<LayoutFallback />}>
                <AuthLayout />
              </Suspense>
            }
          >
            <Route
              path="login"
              element={
                <PublicOnly>
                  <WithSuspense>
                    <LoginPage />
                  </WithSuspense>
                </PublicOnly>
              }
            />
            <Route
              path="activate"
              element={
                <PublicOnly>
                  <WithSuspense>
                    <ActivationPage />
                  </WithSuspense>
                </PublicOnly>
              }
            />
            <Route
              path="forgot-password"
              element={
                <PublicOnly>
                  <WithSuspense>
                    <ForgotPasswordPage />
                  </WithSuspense>
                </PublicOnly>
              }
            />
            <Route
              path="reset-password"
              element={
                <PublicOnly>
                  <WithSuspense>
                    <ResetPasswordPage />
                  </WithSuspense>
                </PublicOnly>
              }
            />
            <Route
              path="change-password"
              element={
                <RequireAuth>
                  <WithSuspense>
                    <ChangePasswordPage />
                  </WithSuspense>
                </RequireAuth>
              }
            />
          </Route>

          {/* ================================================================
              Protected Routes (SINGLE App Layout) - One layout for all roles
              ================================================================ */}
          <Route
            element={
              <RequireAuth>
                <Suspense fallback={<LayoutFallback />}>
                  <AppLayout />
                </Suspense>
              </RequireAuth>
            }
          >
            {/* Student Routes - Uses RequireStudentWrapper with Outlet */}
            <Route element={<RequireStudentWrapper />}>
              <Route
                path="dashboard"
                element={
                  <WithSuspense>
                    <StudentDashboard />
                  </WithSuspense>
                }
              />
              <Route
                path="profile"
                element={
                  <WithSuspense>
                    <StudentProfilePage />
                  </WithSuspense>
                }
              />
              <Route
                path="academics"
                element={
                  <WithSuspense>
                    <StudentAcademicsPage />
                  </WithSuspense>
                }
              />
            </Route>

            {/* Admin Routes - Uses RequireAdminWrapper with Outlet */}
            <Route element={<RequireAdminWrapper />}>
              <Route path="admin" element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
              <Route
                path="admin/dashboard"
                element={
                  <WithSuspense>
                    <AdminDashboard />
                  </WithSuspense>
                }
              />
              <Route
                path="admin/students"
                element={
                  <WithSuspense>
                    <StudentListPage />
                  </WithSuspense>
                }
              />
              <Route
                path="admin/imports"
                element={
                  <WithSuspense>
                    <ImportPage />
                  </WithSuspense>
                }
              />
            </Route>
          </Route>

          {/* ================================================================
              Public Error Routes (Public Layout) - /unauthorized, 404
              ================================================================ */}
          <Route
            element={
              <Suspense fallback={<LayoutFallback />}>
                <PublicLayout />
              </Suspense>
            }
          >
            <Route
              path="unauthorized"
              element={
                <WithSuspense>
                  <UnauthorizedPage />
                </WithSuspense>
              }
            />
          </Route>

          {/* ================================================================
              Catch-all 404
              ================================================================ */}
          <Route
            path="*"
            element={
              <Suspense fallback={<LayoutFallback />}>
                <PublicLayout>
                  <WithSuspense>
                    <NotFoundPage />
                  </WithSuspense>
                </PublicLayout>
              </Suspense>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;
