import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMe, login, logout, signup } from '../api/auth';

// Auth source of truth: the user, or null when not logged in
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return (await getMe()).user;
      } catch (error) {
        if (error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: logout,
    // Even if the request fails, drop everything and go to /login
    onSettled: () => {
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
}

// Login / signup: on success the user goes into ['me'] (so ProtectedRoute lets them in right away)
// and they're sent back to the page they came from
export function useAuthSubmit(type) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  return useMutation({
    mutationFn: type === 'signup' ? signup : login,
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data.user);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    },
  });
}
