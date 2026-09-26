import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import './charts/setupCharts';
import './styles.css';
import './app.css';

const NO_RETRY = [401, 403, 404, 409];

const queryClient = new QueryClient({
  // Cookie expired mid-session: any 401 (except /me itself) logs the user out, ProtectedRoute redirects
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (error.status === 401 && query.queryKey[0] !== 'me') queryClient.setQueryData(['me'], null);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => !NO_RETRY.includes(error.status) && failureCount < 1,
    },
    mutations: { retry: false },
  },
});

createRoot(document.getElementById('root')).render(<React.StrictMode>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
      {/* Success / error notices from every page (toast.success, toast.error, …) */}
      <Toaster position="top-center" richColors closeButton />
    </BrowserRouter>
  </QueryClientProvider>
</React.StrictMode>);
