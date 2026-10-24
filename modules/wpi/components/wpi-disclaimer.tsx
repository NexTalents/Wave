export function WpiDisclaimer({ children }: { children: React.ReactNode }) {
  return (
    <div className="wave-body-sm rounded-2xl border border-gold/50 bg-disclosure p-5 text-brand-800">
      <strong>Important:</strong> {children}
    </div>
  )
}
