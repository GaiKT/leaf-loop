/** Shown at once while a page is being read from the database. Same shape as the real pages, so nothing jumps. */
export default function Loading() {
  return (
    <section role="status" aria-busy="true" aria-live="polite" className="space-y-5">
      <span className="sr-only">กำลังโหลด…</span>
      <div className="space-y-2">
        <div className="skeleton h-8 w-32 rounded-full" />
        <div className="skeleton h-4 w-24 rounded-full" />
      </div>
      <div className="skeleton h-28 w-full rounded-3xl" />
      <div className="space-y-2">
        <div className="skeleton h-4 w-20 rounded-full" />
        <div className="skeleton h-40 w-full rounded-3xl" />
        <div className="skeleton h-40 w-full rounded-3xl" />
      </div>
    </section>
  );
}
