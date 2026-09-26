import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useMe } from '../hooks/useAuth';
import Spinner from './Spinner';

// Login and signup: already logged in → go to the app
export default function PublicOnlyRoute() {
  const { data: user, isPending } = useMe();
  if (isPending) return <Spinner full />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
