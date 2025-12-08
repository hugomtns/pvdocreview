import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { hasPermission } from '@/lib/permissions';
import type { UserRole } from '@/types';

interface RoleGateProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const currentUser = useAuthStore(state => state.currentUser);

  // If no user is logged in, don't render anything
  if (!currentUser) {
    return <>{fallback}</>;
  }

  // Check if user's role is in the allowed roles
  const userHasPermission = hasPermission(currentUser.role, allowedRoles);

  if (!userHasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
