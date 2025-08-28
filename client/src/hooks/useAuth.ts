import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface LoginCredentials {
  email: string;
  password: string;
  isAdmin?: boolean;
}

interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  isAdmin: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const parseJson = async (res: Response) => {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  };

  // ✅ Fetch current logged-in user on app load
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch(
        `${(import.meta as any).env.VITE_API_URL}/api/auth/user`,
        { credentials: "include" }
      );
      if (!res.ok) return null;
      return parseJson(res);
    },
    retry: false,
  });

  // ✅ Login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch(
        `${(import.meta as any).env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Login failed");

      return parseJson(response);
    },
    onSuccess: () => {
      // ✅ Refetch user after login so session persists
      queryClient.invalidateQueries(["/api/auth/user"]);
    },
  });

  // ✅ Register
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await fetch(
        `${(import.meta as any).env.VITE_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Registration failed");

      return parseJson(response);
    },
    onSuccess: () => {
      // ✅ Refetch user after register
      queryClient.invalidateQueries(["/api/auth/user"]);
    },
  });

  // ✅ Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(
        `${(import.meta as any).env.VITE_API_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
