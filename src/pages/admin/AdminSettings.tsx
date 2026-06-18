import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Save, Loader2, Lock, Bell, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_WHATSAPP } from "@/lib/utils";

export default function AdminSettings() {
  const { user } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPw !== confirmPw) throw new Error("Passwords do not match");
      if (newPw.length < 8) throw new Error("Password must be at least 8 characters");
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-light">Settings</h1>
        <p className="text-foreground/50 text-sm mt-1">Manage your admin account and store settings.</p>
      </div>

      {/* Account Info */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Store size={18} className="text-brand-blue-deep" />
          <h2 className="font-heading text-xl font-medium">Account</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-foreground/50">Admin Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-foreground/50">WhatsApp Notifications</span>
            <span className="font-medium">+{ADMIN_WHATSAPP}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-foreground/50">Store Name</span>
            <span className="font-medium">Volta Bianca</span>
          </div>
        </div>
      </div>

      {/* WhatsApp Notifications Info */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-brand-blue-deep" />
          <h2 className="font-heading text-xl font-medium">Order Notifications</h2>
        </div>
        <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-xl p-4 text-sm">
          <p className="font-medium text-brand-blue-deep mb-2">WhatsApp Notifications Active</p>
          <p className="text-foreground/60 leading-relaxed">
            When a customer places an order, their order details are automatically sent to your WhatsApp{" "}
            <strong>+{ADMIN_WHATSAPP}</strong>. You'll receive the customer's name, phone, address, items,
            and total amount — and can respond directly for delivery coordination.
          </p>
        </div>
      </div>

      {/* Change Password */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-brand-blue-deep" />
          <h2 className="font-heading text-xl font-medium">Change Password</h2>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); changePassword.mutate(); }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1.5">New Password</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="input-field"
              placeholder="Minimum 8 characters"
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="input-field"
              placeholder="Repeat new password"
            />
          </div>
          <button
            type="submit"
            disabled={changePassword.isPending || !newPw || !confirmPw}
            className="btn-primary"
          >
            {changePassword.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
