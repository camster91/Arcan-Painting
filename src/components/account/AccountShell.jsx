export default function AccountShell({ title, description, children }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-amber-500 focus:text-slate-900 focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to content
      </a>
      <main id="main" tabIndex={-1} className="min-h-screen bg-slate-50 px-4 py-12 sm:py-20">
        <section className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-amber-700">
          <img src="/logo.png" alt="Arcan Painting" className="h-9 w-auto" />
          <span>Admin</span>
        </a>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
        <div className="mt-7">{children}</div>
        </section>
      </main>
    </>
  );
}

export function AccountAlert({ error, success }) {
  if (!error && !success) return null;
  const isError = Boolean(error);
  return (
    <div role={isError ? "alert" : "status"} className={`mb-5 rounded-lg border px-3 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
      {error || success}
    </div>
  );
}

export const inputClassName = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
export const buttonClassName = "w-full rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60";
