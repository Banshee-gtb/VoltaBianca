import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save, Loader2, Lock, Bell, Store, FileText, Shield,
  CreditCard, Plus, Trash2, Eye, EyeOff, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_WHATSAPP } from "@/lib/utils";

type SettingsTab = "account" | "payment" | "terms" | "privacy";

interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

// ── Shared hook ────────────────────────────────────────────────────────────
function useSettingValue(key: string) {
  return useQuery({
    queryKey: ["setting", key],
    queryFn: async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      return data?.value ?? "";
    },
  });
}

// ── Rich Text Editor ───────────────────────────────────────────────────────
function RichTextEditor({
  label, settingKey, description, icon: Icon,
}: {
  label: string; settingKey: string; description: string; icon: React.ElementType;
}) {
  const qc = useQueryClient();
  const { data: savedValue = "", isLoading } = useSettingValue(settingKey);
  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (savedValue !== undefined) { setContent(savedValue); setIsDirty(false); }
  }, [savedValue]);

  const saveMutation = useMutation({
    mutationFn: async (value: string) => {
      const { data: existing } = await supabase.from("settings").select("id").eq("key", settingKey).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("settings").update({ value, updated_at: new Date().toISOString() }).eq("key", settingKey);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("settings").insert({ key: settingKey, value });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(`${label} saved`); setIsDirty(false); qc.invalidateQueries({ queryKey: ["setting", settingKey] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  function insertFormat(prefix: string, suffix = "") {
    const ta = document.getElementById(`editor-${settingKey}`) as HTMLTextAreaElement;
    if (!ta) return;
    const s = ta.selectionStart, end = ta.selectionEnd;
    const selected = content.slice(s, end);
    const newContent = content.slice(0, s) + prefix + selected + suffix + content.slice(end);
    setContent(newContent); setIsDirty(newContent !== savedValue);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + prefix.length, end + prefix.length); }, 0);
  }

  const toolbarButtons = [
    { label: "B", title: "Bold", action: () => insertFormat("**", "**"), cls: "font-bold" },
    { label: "I", title: "Italic", action: () => insertFormat("_", "_"), cls: "italic" },
    { label: "H2", title: "Heading", action: () => insertFormat("\n## "), cls: "text-xs font-semibold" },
    { label: "•", title: "Bullet", action: () => insertFormat("\n- "), cls: "text-base" },
    { label: "1.", title: "Numbered", action: () => insertFormat("\n1. "), cls: "text-xs font-medium" },
    { label: "—", title: "Divider", action: () => insertFormat("\n\n---\n\n"), cls: "" },
  ];

  if (isLoading) return (
    <div className="glass-card rounded-2xl p-6">
      <div className="h-6 w-32 bg-surface-2 rounded animate-pulse mb-4" />
      <div className="h-48 bg-surface-2 rounded-xl animate-pulse" />
    </div>
  );

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-brand-blue-deep" />
        <h2 className="font-heading text-xl font-medium">{label}</h2>
        {isDirty && <span className="ml-2 text-xs text-orange-500 font-medium">• Unsaved</span>}
      </div>
      <p className="text-sm text-foreground/50 mb-4">{description}</p>
      <div className="flex items-center gap-1 flex-wrap p-2 bg-surface-2 rounded-t-xl border border-border border-b-0">
        {toolbarButtons.map((btn) => (
          <button key={btn.label} type="button" title={btn.title} onClick={btn.action}
            className={`px-2.5 py-1.5 text-sm rounded hover:bg-white hover:shadow-sm transition-all min-w-[32px] text-foreground/70 hover:text-foreground ${btn.cls}`}>
            {btn.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-foreground/30 pr-1">Markdown</span>
      </div>
      <textarea
        id={`editor-${settingKey}`}
        value={content}
        onChange={(e) => { setContent(e.target.value); setIsDirty(e.target.value !== savedValue); }}
        rows={14}
        placeholder={`Write your ${label.toLowerCase()} here...`}
        className="w-full bg-white border border-border rounded-b-xl px-4 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue resize-y min-h-[200px] placeholder:text-muted-foreground transition-all duration-200"
      />
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-foreground/40">{content.length} chars</p>
        <button
          onClick={() => saveMutation.mutate(content)}
          disabled={saveMutation.isPending || !isDirty}
          className={`btn-primary text-sm py-2.5 px-5 ${!isDirty ? "opacity-50" : ""}`}
        >
          {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
      {content && (
        <details className="mt-4">
          <summary className="text-xs text-foreground/50 cursor-pointer hover:text-foreground transition-colors select-none">Preview ▾</summary>
          <div className="mt-3 p-4 bg-surface-1 rounded-xl border border-border text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap break-words">{content}</div>
        </details>
      )}
    </div>
  );
}

// ── Bank Account Panel ─────────────────────────────────────────────────────
function BankAccountsPanel() {
  const qc = useQueryClient();
  const { data: savedRaw = "" } = useSettingValue("bank_accounts");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (savedRaw) {
      try { setAccounts(JSON.parse(savedRaw)); setIsDirty(false); } catch { setAccounts([]); }
    } else {
      setAccounts([]);
    }
  }, [savedRaw]);

  const saveMutation = useMutation({
    mutationFn: async (value: string) => {
      const { data: existing } = await supabase.from("settings").select("id").eq("key", "bank_accounts").maybeSingle();
      if (existing) {
        const { error } = await supabase.from("settings").update({ value, updated_at: new Date().toISOString() }).eq("key", "bank_accounts");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("settings").insert({ key: "bank_accounts", value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Bank accounts saved");
      setIsDirty(false);
      qc.invalidateQueries({ queryKey: ["setting", "bank_accounts"] });
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function addAccount() {
    const updated = [...accounts, { bankName: "", accountName: "", accountNumber: "" }];
    setAccounts(updated);
    setIsDirty(true);
  }

  function removeAccount(i: number) {
    const updated = accounts.filter((_, idx) => idx !== i);
    setAccounts(updated);
    setIsDirty(true);
  }

  function updateAccount(i: number, field: keyof BankAccount, value: string) {
    const updated = accounts.map((a, idx) => idx === i ? { ...a, [field]: value } : a);
    setAccounts(updated);
    setIsDirty(true);
  }

  function handleSave() {
    saveMutation.mutate(JSON.stringify(accounts));
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard size={18} className="text-brand-blue-deep" />
        <h2 className="font-heading text-xl font-medium">Bank Accounts</h2>
        {isDirty && <span className="ml-2 text-xs text-orange-500 font-medium">• Unsaved</span>}
      </div>
      <p className="text-sm text-foreground/50 mb-5">
        Add your bank details here — customers will see these at checkout when "Bank Transfer" is selected.
        Add multiple accounts as fallback.
      </p>

      <div className="space-y-3 mb-4">
        {accounts.length === 0 && (
          <div className="text-center py-8 text-foreground/30 border-2 border-dashed border-border rounded-xl">
            <CreditCard size={32} className="mx-auto mb-2 opacity-30" strokeWidth={1} />
            <p className="text-sm">No bank accounts added yet</p>
          </div>
        )}
        {accounts.map((acc, i) => (
          <div key={i} className="bg-surface-2 rounded-xl p-4 space-y-3 relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground/40 uppercase tracking-wider">Account {i + 1}</span>
              <button
                type="button"
                onClick={() => removeAccount(i)}
                className="text-red-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div>
              <label className="block text-xs text-foreground/50 mb-1">Bank Name *</label>
              <input
                value={acc.bankName}
                onChange={(e) => updateAccount(i, "bankName", e.target.value)}
                placeholder="e.g. First Bank, GTBank, UBA"
                className="input-field py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-foreground/50 mb-1">Account Number *</label>
                <input
                  value={acc.accountNumber}
                  onChange={(e) => updateAccount(i, "accountNumber", e.target.value)}
                  placeholder="0123456789"
                  maxLength={10}
                  className="input-field py-2 text-sm font-mono tracking-widest"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/50 mb-1">Account Name *</label>
                <input
                  value={acc.accountName}
                  onChange={(e) => updateAccount(i, "accountName", e.target.value)}
                  placeholder="MARIAN CHUKWUEMEKA"
                  className="input-field py-2 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={addAccount} className="btn-secondary text-sm flex-1">
          <Plus size={16} /> Add Bank Account
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending || !isDirty}
          className={`btn-primary text-sm px-5 ${!isDirty ? "opacity-50" : ""}`}
        >
          {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save
        </button>
      </div>

      {accounts.length > 0 && !isDirty && (
        <div className="mt-4 flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2">
          <CheckCircle2 size={14} />
          {accounts.length} bank account{accounts.length > 1 ? "s" : ""} active — visible to customers at checkout
        </div>
      )}
    </div>
  );
}

// ── Main Settings Page ─────────────────────────────────────────────────────
export default function AdminSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPw !== confirmPw) throw new Error("Passwords do not match");
      if (newPw.length < 8) throw new Error("Password must be at least 8 characters");
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
      setNewPw(""); setConfirmPw("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "account", label: "Account", icon: Store },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "terms", label: "Terms", icon: FileText },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-light">Settings</h1>
        <p className="text-foreground/50 text-sm mt-1">Manage your account, payment methods, and store content.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-xl mb-6 border border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              activeTab === id ? "bg-white text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground"
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Account Tab ── */}
      {activeTab === "account" && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Store size={18} className="text-brand-blue-deep" />
              <h2 className="font-heading text-xl font-medium">Account Info</h2>
            </div>
            <div className="space-y-0">
              {[
                { label: "Admin Email", value: user?.email },
                { label: "WhatsApp Notifications", value: `+${ADMIN_WHATSAPP}` },
                { label: "Store Name", value: "MiMis Fashion Hub" },
                { label: "Role", value: "Super Admin" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
                  <span className="text-sm text-foreground/50">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={18} className="text-brand-blue-deep" />
              <h2 className="font-heading text-xl font-medium">Order Notifications</h2>
            </div>
            <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-xl p-4 text-sm">
              <p className="font-medium text-brand-blue-deep mb-1.5">WhatsApp Notifications Active</p>
              <p className="text-foreground/60 leading-relaxed">
                New orders automatically sent to WhatsApp <strong>+{ADMIN_WHATSAPP}</strong>. You'll receive
                customer name, phone, address, all items and total — reply directly for delivery coordination.
              </p>
            </div>
          </div>

          {/* Change Password */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lock size={18} className="text-brand-blue-deep" />
              <h2 className="font-heading text-xl font-medium">Change Password</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); changePassword.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Repeat new password"
                  />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1">
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPw && confirmPw && newPw !== confirmPw && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
                {newPw && confirmPw && newPw === confirmPw && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Passwords match
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={changePassword.isPending || !newPw || !confirmPw || newPw !== confirmPw}
                className="btn-primary disabled:opacity-50"
              >
                {changePassword.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Payment Tab ── */}
      {activeTab === "payment" && (
        <div className="animate-fade-in">
          <BankAccountsPanel />
        </div>
      )}

      {/* ── Terms Tab ── */}
      {activeTab === "terms" && (
        <div className="animate-fade-in">
          <RichTextEditor
            label="Terms & Conditions"
            settingKey="terms"
            description="Define the terms of service for your store. Customers can view this on the Terms page."
            icon={FileText}
          />
        </div>
      )}

      {/* ── Privacy Tab ── */}
      {activeTab === "privacy" && (
        <div className="animate-fade-in">
          <RichTextEditor
            label="Privacy Policy"
            settingKey="privacy"
            description="Explain how you collect, use and protect customer data."
            icon={Shield}
          />
        </div>
      )}
    </div>
  );
}
