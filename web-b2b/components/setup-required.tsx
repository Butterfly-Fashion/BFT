import Link from "next/link";

export function SetupRequired() {
  return (
    <main className="min-h-screen bg-[#f6f6f4] px-4 py-10">
      <section className="mx-auto max-w-3xl rounded border border-amber-300 bg-white p-6">
        <p className="text-xs font-black uppercase text-amber-700">Setup required</p>
        <h1 className="mt-2 text-3xl font-black">Supabase environment variables are missing</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          This app uses real Supabase Auth and Postgres, so it needs your Supabase project URL and keys before login,
          registration, products, admin pages, and orders can work.
        </p>
        <div className="mt-5 rounded border border-slate-200 bg-[#fafafa] p-4 font-mono text-sm">
          <p>copy web\.env.example web\.env.local</p>
        </div>
        <p className="mt-4 text-sm font-bold">Then fill in at least:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          <li>SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
        <p className="mt-4 text-sm font-semibold text-slate-600">
          After adding the values, restart the dev server with <span className="font-mono">npm run dev</span>.
        </p>
        <Link className="btn-primary mt-6 inline-flex" href="/register">Registration page exists here</Link>
      </section>
    </main>
  );
}
