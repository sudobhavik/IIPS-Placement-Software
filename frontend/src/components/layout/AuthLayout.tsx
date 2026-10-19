// frontend/src/components/layout/AuthLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children?: ReactNode;
}

export function AuthLayout(_: AuthLayoutProps) {
  const location = useLocation();

  // Debug: Log what's happening
  useEffect(() => {
    console.log("AuthLayout rendered, location:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PlaceIQ</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Placement Management System</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 min-h-[200px]">
          <Outlet />
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          IIPS Placement Cell
        </p>
      </div>
    </div>
  );
}

export default AuthLayout;
