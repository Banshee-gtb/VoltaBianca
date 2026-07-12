import { ADMIN_WHATSAPP } from "@/lib/utils";

const greeting = encodeURIComponent("Hi MiMis Fashion Hub! I'd like to inquire about your products 🛍️");

export default function WhatsAppBubble() {
  return (
    <a
      href={`https://wa.me/${ADMIN_WHATSAPP}?text=${greeting}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-5 z-50 group"
    >
      {/* Pulse rings */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30 pointer-events-none" />
      <span className="absolute inset-[-6px] rounded-full bg-[#25D366] opacity-10 animate-pulse pointer-events-none" />

      {/* Button */}
      <div className="relative w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
        <svg viewBox="0 0 32 32" width="28" height="28" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C8.268 2 2 8.268 2 16c0 2.49.666 4.82 1.826 6.832L2 30l7.394-1.794A13.94 13.94 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.57 11.57 0 01-5.9-1.6l-.42-.252-4.388 1.064 1.1-4.268-.276-.44A11.556 11.556 0 014.4 16c0-6.396 5.204-11.6 11.6-11.6S27.6 9.604 27.6 16 22.396 27.6 16 27.6zm6.352-8.672c-.348-.174-2.06-1.016-2.38-1.132-.32-.116-.552-.174-.784.174-.232.348-.9 1.132-1.104 1.364-.204.232-.406.26-.754.086-.348-.174-1.47-.542-2.8-1.726-1.034-.922-1.732-2.062-1.936-2.41-.204-.348-.022-.536.154-.708.158-.156.348-.406.522-.61.174-.202.232-.348.348-.58.116-.232.058-.436-.028-.61-.088-.174-.784-1.888-1.074-2.586-.282-.678-.57-.586-.784-.596-.204-.01-.436-.012-.668-.012-.232 0-.61.086-.928.434-.32.348-1.22 1.192-1.22 2.906s1.248 3.37 1.422 3.602c.174.232 2.456 3.752 5.952 5.262.832.358 1.482.572 1.988.732.836.266 1.596.228 2.196.138.67-.1 2.06-.842 2.352-1.654.29-.812.29-1.508.202-1.654-.086-.146-.32-.232-.668-.406z"/>
        </svg>
      </div>

      {/* Tooltip */}
      <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
        Chat with us
      </span>
    </a>
  );
}
