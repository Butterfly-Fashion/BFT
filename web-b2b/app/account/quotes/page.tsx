import { redirect } from "next/navigation";

// Quote requests were merged into a single order-request / contact flow.
// Keep this route alive so old links don't 404 — send buyers to Messages.
export default function AccountQuotesPage() {
  redirect("/account/messages");
}
