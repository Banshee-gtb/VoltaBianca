import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type Step = "email" | "otp" | "login";

export default function AdminLogin() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("mimi4vic@gmail.com");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
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

    // Check admin
    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", data.user?.email ?? "")
      .maybeSingle();

    if (!admin) {
      await supabase.auth.signOut();
      toast.error("Access denied. You are not an admin.");
      setSubmitting(false);
      return;
    }

    navigate("/admin");
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("OTP sent! Check your email.");
      setStep("otp");
    }
    setSubmitting(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    if (data.user) {
      await supabase.auth.updateUser({ password, data: { username: "admin" } });

      const { data: admin } = await supabase.from("admins").select("id").eq("email", email).maybeSingle();
      if (!admin) {
        await supabase.auth.signOut();
        toast.error("Access denied.");
        setSubmitting(false);
        return;
      }

      navigate("/admin");
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-blue/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-purple/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-light tracking-widest mb-1">
            VOLTA <span className="text-brand-blue-deep font-medium">BIANCA</span>
          </h1>
          <p className="text-sm text-foreground/40 tracking-wider">Admin Portal</p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          {/* Tabs */}
          <div className="flex rounded-xl bg-surface-2 p-1 mb-6">
            <button
              onClick={() => setStep("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${step === "login" ? "bg-white shadow-sm text-foreground" : "text-foreground/50"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setStep("email")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${step !== "login" ? "bg-white shadow-sm text-foreground" : "text-foreground/50"}`}
            >
              First Time Setup
            </button>
          </div>

          {/* Login form */}
          {step === "login" && (
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
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <><span>Sign In</span><ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          {/* OTP Setup - Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-sm text-foreground/60 bg-brand-blue/10 rounded-xl p-3">
                First time? Enter your admin email to receive a one-time code, then set your password.
              </p>
              <div>
                <label className="block text-sm font-medium mb-1.5">Admin Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : "Send OTP Code"}
              </button>
            </form>
          )}

          {/* OTP Setup - Step 2: Verify + Set Password */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-foreground/60 bg-green-50 text-green-700 rounded-xl p-3">
                OTP sent to {email}. Enter the code and set a new password.
              </p>
              <div>
                <label className="block text-sm font-medium mb-1.5">OTP Code</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="input-field text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Set Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="input-field pl-10 pr-10"
                    placeholder="Minimum 8 characters"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 p-1">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : "Verify & Access Dashboard"}
              </button>
              <button type="button" onClick={() => setStep("email")} className="w-full text-sm text-foreground/40 hover:text-foreground text-center py-2">
                ← Resend OTP
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
