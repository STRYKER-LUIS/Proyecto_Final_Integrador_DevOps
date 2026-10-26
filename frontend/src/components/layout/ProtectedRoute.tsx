import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageLoader } from '../ui/Feedback';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullPageLoader />;
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
