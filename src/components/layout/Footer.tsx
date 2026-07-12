import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
  x?: string;
  shopify?: string;
}

// ── Brand SVG Icons ──────────────────────────────────────────────────────
function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ig-g1" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497"/>
          <stop offset="5%" stopColor="#fdf497"/>
          <stop offset="45%" stopColor="#fd5949"/>
          <stop offset="60%" stopColor="#d6249f"/>
          <stop offset="90%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" fill="url(#ig-g1)"/>
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.8"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#010101"/>
      <path d="M16.6 5.82c-.78-.94-1.21-2.13-1.2-3.32h-2.64v9.88l-.01 5.43a3.13 3.13 0 01-3.12 2.99 3.13 3.13 0 01-3.13-3.13 3.13 3.13 0 013.13-3.13c.29 0 .57.04.84.12V11.9a5.77 5.77 0 00-.84-.06 5.77 5.77 0 00-5.77 5.77 5.77 5.77 0 005.77 5.77 5.77 5.77 0 005.77-5.77V9.12a8.97 8.97 0 005.24 1.68V8.17a4.55 4.55 0 01-4.04-2.35z" fill="white"/>
      <path d="M20.59 8.12v2.63a8.97 8.97 0 01-5.24-1.68V17.4a5.77 5.77 0 01-5.77 5.77 5.77 5.77 0 01-5.77-5.77 5.77 5.77 0 015.77-5.77c.29 0 .57.02.84.06v2.76a3.13 3.13 0 00-.84-.12 3.13 3.13 0 00-3.13 3.13 3.13 3.13 0 003.13 3.13 3.13 3.13 0 003.12-2.99l.01-5.43V2.5h2.64c-.01 1.19.42 2.38 1.2 3.32a4.55 4.55 0 004.04 2.3z" fill="#69C9D0"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#25D366"/>
      <path d="M16 5C9.935 5 5 9.935 5 16c0 2.12.574 4.105 1.576 5.806L5 27l5.348-1.54A10.96 10.96 0 0016 27c6.065 0 11-4.935 11-11S22.065 5 16 5zm0 20.067a9.04 9.04 0 01-4.602-1.253l-.33-.196-3.421.83.862-3.333-.214-.342A9.036 9.036 0 016.933 16c0-4.997 4.07-9.067 9.067-9.067S25.067 11.003 25.067 16 21 25.067 16 25.067zm4.973-6.788c-.272-.136-1.609-.794-1.858-.884-.249-.09-.43-.136-.612.136-.181.272-.702.884-.862 1.066-.158.181-.317.203-.589.068-.272-.136-1.148-.423-2.188-1.35-.808-.72-1.354-1.61-1.512-1.882-.158-.272-.017-.419.12-.554.123-.122.272-.317.407-.476.136-.158.181-.272.272-.453.09-.181.045-.34-.023-.476-.068-.136-.612-1.474-.839-2.02-.22-.53-.445-.458-.612-.465-.158-.008-.34-.01-.521-.01-.181 0-.476.068-.725.34-.249.272-.953.931-.953 2.27s.976 2.632 1.111 2.813c.136.181 1.922 2.933 4.653 4.112.65.28 1.158.447 1.553.572.652.208 1.246.179 1.716.108.523-.079 1.609-.658 1.836-1.293.226-.635.226-1.178.158-1.293-.068-.114-.249-.181-.521-.317z" fill="white"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#000000"/>
      <path d="M13.116 10.845L18.343 5h-1.234l-4.546 5.288L8.952 5H5l5.484 7.986L5 19h1.234l4.797-5.576L14.918 19H19l-5.884-8.155zM11.65 12.68l-.556-.796-4.42-6.32h1.903l3.572 5.108.556.796 4.64 6.636H15.44l-3.79-5.424z" fill="white"/>
    </svg>
  );
}

function ShopifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 109.5 124.5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="109.5" height="124.5" rx="18" fill="#96BF48"/>
      <path d="M74.7 14.8c-.1 0-.2 0-.4.1-.2.1-1.8.4-4.4.9-.5-1.5-1.2-3-2.2-4.2-3.2-3.7-7.6-3-9.8-1.8.1.1-1.9 1.2-3 3.9-.4 1-.6 2.1-.8 3.3l-9.7 3c-2.9.9-3 .9-3.4 3.7-.3 2-7.5 57.9-7.5 57.9l53.4 9.2V14.2c-.5.1-.9.3-1.2.4-.5.1-1 .2-1 .2zm-9.3 2.5c-1.2.4-2.6.8-4.1 1.3 0-.5.1-1 .1-1.5.2-2.3.8-4 1.7-5.2 1.4 1.5 2.3 3.4 2.3 5.4zm-6.6-3.4c-.5.6-1 1.8-1.2 3.5-.2 1-.3 2.2-.3 3.5l-5.2 1.6c1-4 3.6-6.8 6.7-8.6zm1.5 1c-.2.1-.3.1-.5.2 0-.3-.1-.5-.2-.8.2.2.5.4.7.6z" fill="white"/>
      <path d="M74.3 14.9l-1.6.3s-2-1.1-4.3-1.5c0-.1 0-.3.1-.4.1-.4.2-.8.3-1.1.4-1.8 1.3-3.2 2.5-4.2 1.8 1.5 3 3.9 3 6.9z" fill="#5E8E3E"/>
      <path d="M58.8 38.7l-3.5 10.4s-3.1-1.7-6.9-1.7c-5.5 0-5.8 3.5-5.8 4.4 0 4.8 12.5 6.6 12.5 17.9 0 8.9-5.6 14.6-13.2 14.6-9.1 0-13.7-5.7-13.7-5.7l2.4-8s4.8 4.1 8.8 4.1c2.6 0 3.7-2.1 3.7-3.6 0-6.3-10.2-6.6-10.2-16.9 0-8.7 6.2-17.1 18.8-17.1 4.8 0 7.1 1.6 7.1 1.6z" fill="white"/>
    </svg>
  );
}

export default function Footer() {
  const { data: socialLinks } = useQuery<SocialLinks>({
    queryKey: ["social-links"],
    queryFn: async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "social_links")
        .maybeSingle();
      if (!data?.value) return {};
      try { return JSON.parse(data.value); } catch { return {}; }
    },
    staleTime: 60_000,
  });

  const socials = [
    {
      key: "instagram",
      label: "Instagram",
      icon: <InstagramIcon />,
      href: socialLinks?.instagram || null,
    },
    {
      key: "tiktok",
      label: "TikTok",
      icon: <TikTokIcon />,
      href: socialLinks?.tiktok || null,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: <WhatsAppIcon />,
      href: socialLinks?.whatsapp || `https://wa.me/2349132996389`,
    },
    {
      key: "x",
      label: "X (Twitter)",
      icon: <XIcon />,
      href: socialLinks?.x || null,
    },
    {
      key: "shopify",
      label: "Shopify",
      icon: <ShopifyIcon />,
      href: socialLinks?.shopify || null,
    },
  ];

  return (
    <footer className="bg-surface-2 border-t border-border mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <h2 className="font-heading text-2xl font-light tracking-widest mb-3">
              MiMis <span className="text-brand-blue-deep font-medium">Fashion Hub</span>
            </h2>
            <p className="text-sm text-foreground/60 leading-relaxed mb-5">
              Curated fashion, beauty, and lifestyle — delivered with care and elegance.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2 flex-wrap">
              {socials.map(({ key, label, icon, href }) =>
                href ? (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:opacity-80 hover:scale-110 transition-all duration-200 shadow-sm"
                    title={label}
                  >
                    {icon}
                  </a>
                ) : null
              )}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-heading text-lg font-medium mb-4">Shop</h3>
            <div className="flex flex-col gap-2">
              <Link to="/products" className="text-sm text-foreground/60 hover:text-foreground transition-colors">All Products</Link>
              <Link to="/products?cat=Fashion%20%2F%20Clothing" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Fashion &amp; Clothing</Link>
              <Link to="/products?cat=Beauty%20%2F%20Skincare" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Beauty &amp; Skincare</Link>
              <Link to="/products?cat=Lifestyle%20%2F%20Home" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Lifestyle &amp; Home</Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-heading text-lg font-medium mb-4">Info</h3>
            <div className="flex flex-col gap-2">
              <a
                href="https://wa.me/2349132996389"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground/60 hover:text-foreground transition-colors"
              >
                Chat with us on WhatsApp
              </a>
              <span className="text-sm text-foreground/40 mt-1">Orders tracked via WhatsApp</span>
              <Link to="/products" className="text-sm text-foreground/60 hover:text-foreground transition-colors mt-1">
                Shop All Products
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 text-center">
          <p className="text-xs text-foreground/40">© {new Date().getFullYear()} MiMis Fashion Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
