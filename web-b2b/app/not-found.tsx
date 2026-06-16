import Link from "next/link";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const profile = await getCurrentProfile().catch(() => null);
  return (
    <>
      <Header profile={profile} />
      <main className="container-shell flex flex-col items-center justify-center py-24 text-center">
        <p className="text-6xl font-black" style={{ color: "var(--primary)" }}>404</p>
        <h1 className="mt-3 text-2xl font-black text-gray-900">Page not found</h1>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          The page you’re looking for doesn’t exist or may have moved. Browse the wholesale catalog
          or head back to the homepage.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/products" className="btn-primary px-6 py-2.5 text-sm">Browse catalog</Link>
          <Link href="/" className="btn-secondary px-6 py-2.5 text-sm">Go home</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
