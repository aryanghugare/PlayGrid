import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "./api";
import type { User } from "./types";
const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await api<User>("/users/current-user");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
  async function signIn(identifier: string, password: string) {
    const result = await api<{ user: User }>("/users/login", {
      method: "POST",
      body: {
        [identifier.includes("@") ? "email" : "username"]: identifier,
        password,
      },
    });
    await cache.cancelQueries();
    cache.removeQueries({
      predicate: (query) => query.queryKey[0] !== "session",
    });
    cache.setQueryData(["session"], result.user);
  }
  async function signOut() {
    await api("/users/logout", { method: "POST" });
    await cache.cancelQueries();
    cache.removeQueries({
      predicate: (query) => query.queryKey[0] !== "session",
    });
    cache.setQueryData(["session"], null);
  }
  return (
    <AuthContext.Provider
      value={{
        user: session.data || null,
        loading: session.isPending,
        error: session.error,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
