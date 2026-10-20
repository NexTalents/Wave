"use client"

import { createContext, useContext, useMemo, useState } from "react"
import { homeByLanguage, siteByLanguage, type Language } from "@/modules/amartha-landing-page/config"

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void }
const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("ID")
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider")
  return context
}

export function useLocalizedContent() {
  const { language } = useLanguage()
  return useMemo(() => ({ language, site: siteByLanguage[language], home: homeByLanguage[language] }), [language])
}
