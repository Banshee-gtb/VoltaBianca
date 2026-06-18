import { X, ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQty, total } = useCart();

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-surface-1 z-50 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-blue-deep" />
            <span className="font-heading text-xl font-medium">Your Bag</span>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-foreground/50">
              <ShoppingBag size={48} strokeWidth={1} />
              <p className="font-heading text-lg">Your bag is empty</p>
              <button onClick={onClose} className="btn-secondary text-sm">Continue Shopping</button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div key={`${item.productId}__${item.variantId}`} className="flex gap-3 p-3 bg-white rounded-xl border border-border/50">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-2 flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/20">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    {item.variantLabel && (
                      <p className="text-xs text-foreground/50 mt-0.5">{item.variantLabel}</p>
                    )}
                    <p className="text-sm font-medium text-brand-blue-deep mt-1">{formatPrice(item.price)}</p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-surface-2 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-surface-2 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-foreground/30 hover:text-red-400 transition-colors self-start p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-foreground/70 text-sm">Subtotal</span>
              <span className="font-heading text-xl font-medium">{formatPrice(total)}</span>
            </div>
            <Link to="/checkout" onClick={onClose} className="btn-primary w-full text-center">
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
