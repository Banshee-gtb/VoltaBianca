import { Link } from "react-router-dom";
import { Instagram, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface-2 border-t border-border mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <h2 className="font-heading text-2xl font-light tracking-widest mb-3">
              MiMis <span className="text-brand-blue-deep font-medium">Fashion Hub</span>
            </h2>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Curated fashion, beauty, and lifestyle — delivered with care and elegance.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="btn-ghost p-2" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="https://wa.me/2349132996389" target="_blank" rel="noopener noreferrer" className="btn-ghost p-2" aria-label="WhatsApp">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-heading text-lg font-medium mb-4">Shop</h3>
            <div className="flex flex-col gap-2">
              <Link to="/products" className="text-sm text-foreground/60 hover:text-foreground transition-colors">All Products</Link>
              <Link to="/products?cat=Fashion" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Fashion & Clothing</Link>
              <Link to="/products?cat=Beauty" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Beauty & Skincare</Link>
              <Link to="/products?cat=Lifestyle" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Lifestyle & Home</Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-heading text-lg font-medium mb-4">Info</h3>
            <div className="flex flex-col gap-2">
              <a href="https://wa.me/2349132996389" target="_blank" rel="noopener noreferrer" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
                Contact Us on WhatsApp
              </a>
              <span className="text-sm text-foreground/40 mt-2">Orders tracked via WhatsApp</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 text-center">
          <p className="text-xs text-foreground/40">© 2025 MiMis Fashion Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
