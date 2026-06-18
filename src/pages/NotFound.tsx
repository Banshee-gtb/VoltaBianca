import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-32 text-center">
        <p className="font-heading text-8xl font-light text-brand-blue/30 mb-4">404</p>
        <h1 className="font-heading text-3xl font-light mb-3">Page not found</h1>
        <p className="text-foreground/50 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );
}
