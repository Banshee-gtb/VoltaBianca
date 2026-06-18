import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartDrawer from "@/components/features/CartDrawer";

export default function Navbar() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  return (
    <>
      <nav className="glass-nav sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="font-heading text-2xl font-light tracking-widest text-foreground">
              VOLTA <span className="text-brand-blue-deep font-medium">BIANCA</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Home</Link>
              <Link to="/products" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Shop</Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="input-field w-40 sm:w-56 py-2 text-sm"
                  />
                  <button type="button" onClick={() => setSearchOpen(false)} className="btn-ghost p-2">
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <button onClick={() => setSearchOpen(true)} className="btn-ghost p-2">
                  <Search size={18} />
                </button>
              )}

              {/* Cart */}
              <button onClick={() => setCartOpen(true)} className="btn-ghost p-2 relative">
                <ShoppingBag size={20} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-purple-deep text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>

              {/* Mobile menu */}
              <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost p-2 md:hidden">
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden border-t border-border py-4 flex flex-col gap-1 animate-fade-in">
              <Link to="/" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start text-sm py-3">Home</Link>
              <Link to="/products" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start text-sm py-3">Shop All</Link>
            </div>
          )}
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
