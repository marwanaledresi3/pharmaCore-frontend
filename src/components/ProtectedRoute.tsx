import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ permission }: { permission?: string } = {}) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        جارٍ التحميل...
      </div>
    );
  }

  // غير مسجّل → إلى /login مع حفظ "من أين جاء"
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // مسجّل لكن لا يملك الصلاحية
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}