import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/auth.store';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      email,
      password,
      businessSlug,
    }: {
      email: string;
      password: string;
      businessSlug: string;
    }) => authService.login(email, password, businessSlug),
    onSuccess: (data) => {
      setAuth(data.token, data.user, data.business);
      router.push('/dashboard');
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setAuth(data.token, data.user, data.business);
      router.push('/dashboard');
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const router = useRouter();

  return () => {
    logout();
    router.replace('/auth/login');
  };
}

/**
 * Validates the stored token against the backend on mount.
 * If the token is invalid/expired the api interceptor will
 * clear localStorage and redirect to /auth/login automatically.
 */
export function useSession() {
  const { token, setAuth } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const data = await authService.me();
      // Keep the stored token — /me doesn't return a new one
      setAuth(token!, data.user, data.business);
      return data;
    },
    // Only run when we have a token in the store
    enabled: !!token,
    // Re-validate once per app session (page load), not on every refocus
    staleTime: Infinity,
    retry: false,
  });
}
