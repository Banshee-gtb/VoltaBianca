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
  const [loading, setLoading] = useState(true);

  async function checkAdmin(u: User) {
    const { data } = await supabase
      .from("admins")
      .select("id, email")
      .eq("email", u.email ?? "")
      .maybeSingle();
    if (data) setAdminUser(data);
    else setAdminUser(null);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user).finally(() => { if (mounted) setLoading(false); });
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkAdmin(session.user);
      } else {
        setAdminUser(null);
      }
      setLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
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
