import { useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLogin() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("mimi4vic@gmail.com");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAdmin) return <Navigate to="/admin" replace />;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // Verify admin access
    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", data.user?.email ?? "")
      .maybeSingle();

    if (!admin) {
      await supabase.auth.signOut();
      toast.error("Access denied. You are not an authorised admin.");
      setSubmitting(false);
      return;
    }

    navigate("/admin");
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-blue/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-light tracking-widest mb-1">
            MiMis{" "}
            <span className="text-brand-blue-deep font-medium">Fashion Hub</span>
          </h1>
          <p className="text-sm text-foreground/40 tracking-wider">Admin Portal</p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          <h2 className="font-heading text-xl font-medium text-center mb-6">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="Admin email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 mt-2">
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-foreground/30 text-center mt-6">
            Authorised personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
