export default function DocumentLoading() {
  return (
    <div className="animate-pulse" aria-busy aria-label="Loading document">
      <div className="h-14 border-b border-line bg-paper" />
      <div className="border-b border-line bg-paper">
        <div className="mx-auto max-w-page px-6 pt-4">
          <div className="h-6 w-56 rounded bg-line" />
          <div className="mt-3 flex gap-1 pb-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-8 w-8 rounded bg-line/60" />
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 py-8 sm:px-6">
        <div className="mx-auto min-h-[60vh] max-w-page rounded-sm border border-line bg-paper px-8 py-10 sm:px-16 sm:py-14">
          <div className="h-8 w-2/3 rounded bg-line" />
          <div className="mt-6 space-y-3">
            {[100, 95, 80, 90, 60].map((w, i) => (
              <div key={i} className="h-4 rounded bg-line/60" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
