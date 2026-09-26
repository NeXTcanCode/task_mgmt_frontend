import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMe } from '../hooks/useAuth';
import ErrorAlert from './ErrorAlert';
import Spinner from './Spinner';

export default function ProtectedRoute() {
  const { data: user, isPending, error, refetch } = useMe();
  const location = useLocation();

  if (isPending) return <Spinner full />;
  if (error) return <div className="container py-5"><ErrorAlert error={error} onRetry={refetch} /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
