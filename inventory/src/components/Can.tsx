import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/useAuth';

/**
 * Render children only if the user has the permission (any of, when a list).
 * Use the same permission code the backend route checks, so the UI never
 * offers an action the API will refuse.
 */
export function Can({
  perm,
  children,
  fallback = null,
}: {
  perm: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission } = useAuth();
  const list = Array.isArray(perm) ? perm : [perm];
  return <>{list.some((p) => hasPermission(p)) ? children : fallback}</>;
}
