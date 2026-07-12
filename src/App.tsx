import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import NotFound from "@/pages/NotFound";

import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import ProductForm from "@/pages/admin/ProductForm";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminLayout from "@/components/layout/AdminLayout";
import WhatsAppBubble from "@/components/features/WhatsAppBubble";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1">
      <div className="flex flex-col items-center gap-4">
        <img src="/mh-logo.png" alt="MiMis Fashion Hub" className="w-16 h-16 object-contain opacity-60 animate-pulse" />
        <div className="w-8 h-8 border-2 border-brand-blue-deep border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground/40">Loading admin panel...</p>
      </div>
    </div>
  );

  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<><Home /><WhatsAppBubble /></>} />
            <Route path="/products" element={<><Products /><WhatsAppBubble /></>} />
            <Route path="/products/:id" element={<><ProductDetail /><WhatsAppBubble /></>} />
            <Route path="/checkout" element={<><Checkout /><WhatsAppBubble /></>} />
            <Route path="/order-confirmation" element={<><OrderConfirmation /><WhatsAppBubble /></>} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={<AdminGuard><AdminLayout /></AdminGuard>}
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id/edit" element={<ProductForm />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
