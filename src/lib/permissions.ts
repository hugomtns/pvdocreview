import type { UserRole } from '@/types';

/**
 * Check if a user role has permission based on allowed roles
 */
export function hasPermission(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Check if a user role can perform specific actions
 */
export const canViewDocuments = (role: UserRole): boolean => {
  return hasPermission(role, ['viewer', 'reviewer', 'admin']);
};

export const canAddComments = (role: UserRole): boolean => {
  return hasPermission(role, ['reviewer', 'admin']);
};

export const canResolveComments = (role: UserRole): boolean => {
  return hasPermission(role, ['reviewer', 'admin']);
};

export const canRequestApproval = (role: UserRole): boolean => {
  return hasPermission(role, ['reviewer', 'admin']);
};

export const canApproveReject = (role: UserRole): boolean => {
  return hasPermission(role, ['admin']);
};

export const canUploadDocuments = (role: UserRole): boolean => {
  return hasPermission(role, ['admin']);
};

export const canUploadNewVersion = (role: UserRole): boolean => {
  return hasPermission(role, ['admin']);
};
