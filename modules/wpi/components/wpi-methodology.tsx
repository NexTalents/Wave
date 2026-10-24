import { Disclosure } from "@/modules/landing-page/components/primitives/disclosure"

export function WpiMethodology({
  title,
  faq,
}: {
  title: string
  faq: [string, string][]
}) {
  return (
    <section
      className="rounded-2xl bg-brand-800 p-6 text-white desktop:p-10"
      id="metodologi"
    >
      <h2 className="wave-section-title">{title}</h2>
      <div className="mt-6 divide-y divide-white/15">
        {faq.map(([question, answer]) => (
          <Disclosure
            className="border-white/10"
            key={question}
            summary={question}
          >
            {answer}
          </Disclosure>
        ))}
      </div>
    </section>
  )
}
