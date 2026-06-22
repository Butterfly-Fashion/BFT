import Link from "next/link";
import { Phone, Mail, MessageSquare } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONE, contactMailto, contactTel } from "@/lib/contact";

// Reusable "order by phone/email" buttons. Real orders mostly arrive by phone or
// email, so this is surfaced on the home page and on product pages.
export function OrderContactCta({
  showMessages = false,
  className = "",
}: {
  showMessages?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <a href={contactTel} className="btn-primary gap-2 px-5 py-2.5 text-sm">
        <Phone size={15} /> {CONTACT_PHONE}
      </a>
      <a href={contactMailto} className="btn-secondary gap-2 px-5 py-2.5 text-sm">
        <Mail size={15} /> {CONTACT_EMAIL}
      </a>
      {showMessages && (
        <Link href="/account/messages" className="btn-ghost gap-2 px-5 py-2.5 text-sm">
          <MessageSquare size={15} /> Message us
        </Link>
      )}
    </div>
  );
}
