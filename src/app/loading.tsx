export default function DashboardLoading() {
  return (
    <>
      <div className="h-14 border-b border-line bg-paper" />
      <main className="mx-auto max-w-page animate-pulse px-6 py-10" aria-busy aria-label="Loading documents">
        <div className="h-7 w-40 rounded bg-line" />
        <div className="mt-2 h-4 w-72 rounded bg-line/60" />
        {[3, 1].map((rows, i) => (
          <section key={i} className="mt-10">
            <div className="mb-2 h-4 w-28 rounded bg-line/60" />
            <div className="divide-y divide-line rounded border border-line bg-paper">
              {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="px-4 py-3">
                  <div className="h-4 w-48 rounded bg-line" />
                  <div className="mt-2 h-3 w-32 rounded bg-line/60" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
