import React, { createContext, useState, useEffect } from 'react'

export const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language')
    if (saved) return saved
    return 'uk' // значення за замовчуванням - українська
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const switchLanguage = (lang) => {
    if (['uk', 'en'].includes(lang)) {
      setLanguage(lang)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}


