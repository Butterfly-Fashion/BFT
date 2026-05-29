"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

export function FloatingChatButton() {
  const pathname = usePathname();

  // Hide on admin pages, login/register pages
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  return (
    <Link
      href="/account/messages"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
      style={{ background: "var(--primary)" }}
      aria-label="Contact support"
    >
      <MessageCircle size={18} />
      <span className="hidden sm:inline">Message us</span>
    </Link>
  );
}
