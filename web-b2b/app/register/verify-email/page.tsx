import { redirect } from "next/navigation";

export default function VerifyEmailPage() {
  redirect("/login?registered=1");
}
