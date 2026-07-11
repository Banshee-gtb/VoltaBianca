import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AdminUser } from "@/types";

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  adminUser: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  // Start loading = true; only flip to false once initial session check is complete
  const [loading, setLoading] = useState(true);

  async function checkAdmin(u: User): Promise<void> {
    const { data } = await supabase
      .from("admins")
      .select("id, email")
      .eq("email", u.email ?? "")
      .maybeSingle();
    setAdminUser(data ?? null);
  }

  useEffect(() => {
    let mounted = true;

    // Safety #1: restore session on page load / refresh
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkAdmin(session.user);
      }
      if (mounted) setLoading(false);
    });

    // Safety #2: real-time auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user);
          await checkAdmin(session.user);
          // Only clear the loading spinner if it's still spinning
          setLoading(false);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setAdminUser(null);
          setLoading(false);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          setUser(session.user);
          // Don't re-check admin on token refresh — no change expected
        }
        // For other events (INITIAL_SESSION handled above) don't touch loading
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, adminUser, isAdmin: !!adminUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
