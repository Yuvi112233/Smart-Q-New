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
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: false, // Don't auto-fetch user data on app load
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // For development, simulate a successful login
      // In production, this would make an API call
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      return parseJson(response);
    },
    onSuccess: (data) => {
      // Set user data after successful login
      queryClient.setQueryData(["/api/auth/user"], data);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      return parseJson(response);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // For development, simulate logout
      // In production, this would make an API call
      await fetch(`${(import.meta as any).env.VITE_API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      // Clear user data after logout
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading: false, // Always show as not loading
    isAuthenticated: !!user, // Check if user exists
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
