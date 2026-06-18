import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, Tags, Settings,
  LogOut, Menu, X, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, adminUser } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-surface-1 flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-64
        bg-white border-r border-border flex flex-col
        transition-transform duration-300
        md:translate-x-0 md:static md:z-auto
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-light tracking-widest">
              VOLTA <span className="text-brand-blue-deep font-medium">BIANCA</span>
            </h1>
            <p className="text-xs text-foreground/40 mt-0.5">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-foreground/50 hover:text-foreground p-1">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `admin-sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
                <ChevronRight size={14} className="ml-auto opacity-30" />
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs text-foreground/40">Logged in as</p>
            <p className="text-sm font-medium truncate">{adminUser?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="admin-sidebar-link w-full text-red-400 hover:text-red-500 hover:bg-red-50"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="md:hidden glass-nav px-4 h-14 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2">
            <Menu size={20} />
          </button>
          <span className="font-heading text-lg font-light tracking-wider">
            VOLTA <span className="text-brand-blue-deep font-medium">BIANCA</span>
          </span>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
