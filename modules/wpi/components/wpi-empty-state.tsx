export function WpiEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="wave-body-sm rounded-2xl border border-dashed border-brand-200 bg-brand-50 px-6 py-10 text-center text-brand-700">
      {children}
    </div>
  )
}
