// frontend/src/features/auth/useAuth.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { authApi } from "./authApi";
import { apiClient, clearAuth, setAuth, getStoredUser, getStoredToken } from "../../api/client";
import { STORAGE_KEYS, USER_ROLES, ROUTES } from "../../lib/constants";
import type { MeResponse, UserRole, LoginResponse } from "../../api/types";

// ============================================================================
// Auth Context Types
// ============================================================================

interface AuthContextType {
  // State
  user: MeResponse | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Computed
  isAuthenticated: boolean;
  role: UserRole | null;
  isStudent: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  studentId: number | null;

  // Actions
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  activate: (data: {
    token: string;
    enrollment_no: string;
    dob: string;
    new_password: string;
    accepted_terms: boolean;
  }) => Promise<void>;
  changePassword: (current_password: string, new_password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setMustChangePassword: (value: boolean) => void;
}

// ============================================================================
// Create Context - THIS WAS MISSING
// ============================================================================

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================================
// Auth Provider Component
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // ========================================================================
  // Initialize Auth on Mount
  // ========================================================================
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken || !storedUser) {
        if (mounted) {
          setIsInitialized(true);
          setIsLoading(false);
        }
        return;
      }

      // Verify token is still valid by calling /me
      try {
        const freshUser = await authApi.me();
        if (mounted) {
          setUser(freshUser);
          setAccessToken(storedToken);
        }
      } catch {
        // Token invalid, clear auth
        if (mounted) {
          clearAuth();
        }
      } finally {
        if (mounted) {
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // ========================================================================
  // Computed Values
  // ========================================================================
  const isAuthenticatedUser = !!user && !!accessToken;
  const role = user?.role ?? null;
  const isStudent = role === USER_ROLES.STUDENT;
  const isAdmin = role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;
  const isSuperAdmin = role === USER_ROLES.SUPER_ADMIN;
  const mustChangePassword = user?.must_change_password ?? false;
  const studentId = user?.student_id ?? null;

  // ========================================================================
  // Actions
  // ========================================================================
  const login = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(identifier, password);
      const { access_token, must_change_password, role: userRole } = response;

      // FIX: Set auth FIRST so /auth/me has the Authorization header
      setAuth(access_token, {
        id: 0,
        email: "",
        full_name: "",
        phone: null,
        role: userRole,
        must_change_password,
        student_id: null,
      } as MeResponse); // Temporary user for header

      // Now fetch user info with token
      const userInfo = await authApi.me();

      // Update with real user info
      setAuth(access_token, userInfo);
      setUser(userInfo);
      setAccessToken(access_token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
      setUser(null);
      setAccessToken(null);
      apiClient.defaults.headers.common.Authorization = "";
      setIsLoading(false);
      window.location.href = ROUTES.LOGIN;
    }
  }, []);

  const activate = useCallback(
    async (data: {
      token: string;
      enrollment_no: string;
      dob: string;
      new_password: string;
      accepted_terms: boolean;
    }) => {
      setIsLoading(true);
      try {
        await authApi.activate(data);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const changePassword = useCallback(
    async (current_password: string, new_password: string) => {
      setIsLoading(true);
      try {
        await authApi.changePassword({ current_password, new_password });
        if (user) {
          const updatedUser = { ...user, must_change_password: false };
          setUser(updatedUser);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authApi.me();
      setUser(freshUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser));
    } catch {
      // Token might be expired, logout will be handled by interceptor
    }
  }, []);

  const setMustChangePassword = useCallback((value: boolean) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, must_change_password: value };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ========================================================================
  // Context Value
  // ========================================================================
  const value = useMemo<AuthContextType>(
    () => ({
      // State
      user,
      accessToken,
      isLoading,
      isInitialized,

      // Computed
      isAuthenticated: isAuthenticatedUser,
      role,
      isStudent,
      isAdmin,
      isSuperAdmin,
      mustChangePassword,
      studentId,

      // Actions
      login,
      logout,
      activate,
      changePassword,
      refreshUser,
      setMustChangePassword,
    }),
    [
      user,
      accessToken,
      isLoading,
      isInitialized,
      isAuthenticatedUser,
      role,
      isStudent,
      isAdmin,
      isSuperAdmin,
      mustChangePassword,
      studentId,
      login,
      logout,
      activate,
      changePassword,
      refreshUser,
      setMustChangePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook to Use Auth Context
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ============================================================================
// Hook for Role-Based Access
// ============================================================================

export function useRoleAccess(allowedRoles: UserRole[]): boolean {
  const { role } = useAuth();
  return role !== null && allowedRoles.includes(role);
}

export function useRequireRole(allowedRoles: UserRole[]): void {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    throw new Error("User not authenticated");
  }

  if (role === null || !allowedRoles.includes(role)) {
    throw new Error("Insufficient permissions");
  }
}
