// frontend/src/components/layout/PublicLayout.tsx
import { Outlet } from "react-router-dom";
import { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          {/* FIXED: Added Outlet to render child routes */}
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default PublicLayout;
