// frontend/src/components/layout/AppLayout.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Header } from "./Header";
import { cn } from "../../lib/utils";
import { useAuth } from "../../features/auth/useAuth";
import { USER_ROLES, SIDEBAR_ITEMS } from "../../lib/constants";

// ============================================================================
// Mobile Sidebar Context
// ============================================================================

interface MobileSidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextType | null>(null);

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  return (
    <MobileSidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

export function useMobileSidebar() {
  const context = useContext(MobileSidebarContext);
  if (!context) {
    throw new Error("useMobileSidebar must be used within MobileSidebarProvider");
  }
  return context;
}

// ============================================================================
// MobileSidebarRouteHandler - Closes sidebar on route change
// ============================================================================

function MobileSidebarRouteHandler() {
  const location = useLocation();
  const { close: closeMobileSidebar } = useMobileSidebar();

  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, closeMobileSidebar]);

  return null;
}

// ============================================================================
// Header Wrapper (Fixes hook call inside handler)
// ============================================================================

function HeaderWrapper() {
  const { toggle } = useMobileSidebar();
  return <Header onMenuClick={toggle} />;
}

// ============================================================================
// Sidebar Overlay (Mobile)
// ============================================================================

function SidebarOverlay() {
  const { isOpen, close } = useMobileSidebar();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity"
      onClick={close}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// Main App Layout
// ============================================================================

const STORAGE_KEY = "placeiq_sidebar_collapsed";

export function AppLayout() {
  const { role } = useAuth();
  const location = useLocation();

  // Lazy initialize state from localStorage to prevent re-renders & flicker
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sidebarCollapsed));
    } catch (e) {
      console.error("Failed to persist sidebar state:", e);
    }
  }, [sidebarCollapsed]);

  const userRole = role ?? USER_ROLES.STUDENT;
  const sidebarItems = SIDEBAR_ITEMS[userRole] || [];

  return (
    <MobileSidebarProvider>
      <MobileSidebarRouteHandler />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <SidebarOverlay />

        <Sidebar
          items={sidebarItems}
          collapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
          currentPath={location.pathname}
        />

        <div
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-200",
            sidebarCollapsed ? "lg:pl-20" : "lg:pl-64",
          )}
        >
          <HeaderWrapper />

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </MobileSidebarProvider>
  );
}

// ============================================================================
// Sidebar Component
// ============================================================================

interface SidebarProps {
  items: Array<{ path: string; label: string; icon: string }>;
  collapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  currentPath: string;
}

function Sidebar({ items, collapsed, onToggleCollapse, currentPath }: SidebarProps) {
  const { isOpen, close } = useMobileSidebar();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 hidden lg:flex flex-col",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && <span className="text-xl font-bold text-primary">PlaceIQ</span>}
          <button
            onClick={() => onToggleCollapse(!collapsed)}
            className={cn(
              "p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors",
              collapsed && "mx-auto",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Main navigation">
          <ul className="space-y-1" role="list">
            {items.map((item) => {
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
              const Icon = getIcon(item.icon);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 dark:bg-primary/20 text-primary"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white",
                      collapsed && "justify-center px-2",
                    )}
                    aria-current={isActive ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")}
                      aria-hidden="true"
                    />
                    {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <UserMenu collapsed={collapsed} />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 lg:hidden w-64 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xl font-bold text-primary">PlaceIQ</span>
          <button
            onClick={close}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Mobile navigation">
          <ul className="space-y-1" role="list">
            {items.map((item) => {
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
              const Icon = getIcon(item.icon);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 dark:bg-primary/20 text-primary"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white",
                    )}
                    aria-current={isActive ? "page" : undefined}
                    onClick={close}
                  >
                    <Icon
                      className={cn("h-6 w-6 flex-shrink-0", isActive && "text-primary")}
                      aria-hidden="true"
                    />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <UserMenu collapsed={false} />
      </aside>
    </>
  );
}

// ============================================================================
// Icon Helpers
// ============================================================================

function getIcon(name: string) {
  const icons: Record<string, React.FC<{ className?: string }>> = {
    "layout-dashboard": DashboardIcon,
    users: UsersIcon,
    upload: UploadIcon,
    settings: SettingsIcon,
  };
  return icons[name] || DashboardIcon;
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

// ============================================================================
// User Menu (Sidebar Footer)
// ============================================================================

function UserMenu({ collapsed }: { collapsed?: boolean }) {
  const { user, logout, role } = useAuth();
  const { close: closeMobileSidebar } = useMobileSidebar();

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-3 border-t border-gray-200 dark:border-gray-700",
        collapsed && "justify-center px-2",
      )}
    >
      <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white font-medium text-sm">
        {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
      </div>

      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user?.full_name || "User"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {role?.replace("_", " ") || "student"}
          </p>
        </div>
      )}

      <button
        onClick={() => {
          logout();
          closeMobileSidebar();
        }}
        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
        aria-label="Logout"
        title={collapsed ? "Logout" : undefined}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    </div>
  );
}

export default AppLayout;
