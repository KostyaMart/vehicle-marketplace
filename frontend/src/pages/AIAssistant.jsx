import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ThemeContext } from '../context/ThemeContext'
import { LanguageContext } from '../context/LanguageContext'
import { getVehicleAiRecommendations } from '../api/assistant'
import { useLocation } from 'react-router-dom'

const translations = {
   uk: {
     title: 'ШІ Помічник підбору транспорту',
     subtitle: 'Опишіть, що шукаєте, а Gemini підбере найкращі варіанти з поточних оголошень.',
     query: 'Що вам потрібно?',
     queryPlaceholder: 'Наприклад: сімейний кросовер, комфортний седан або мотоцикл для міста',
     ask: 'Підібрати транспорт',
     loading: 'Gemini підбирає варіанти...',
     noResults: 'Поки немає рекомендацій. Заповніть форму і натисніть кнопку вище.',
     open: 'Відкрити оголошення',
     reason: 'Чому підходить',
     match: 'Відповідність',
     year: 'Рік',
     mileage: 'Пробіг',
     modelUsed: 'Модель',
   },
   en: {
     title: 'AI Vehicle Assistant',
     subtitle: 'Describe what you need and Gemini will pick the best listings from the marketplace.',
     query: 'What are you looking for?',
     queryPlaceholder: 'For example: family crossover, comfortable sedan, or a city motorcycle',
     ask: 'Find vehicles',
     loading: 'Gemini is selecting options...',
     noResults: 'No recommendations yet. Fill the form and click the button above.',
     open: 'Open listing',
     reason: 'Why it fits',
     match: 'Match',
     year: 'Year',
     mileage: 'Mileage',
     modelUsed: 'Model',
   },
 }

const DEFAULT_FORM = {
  query: '',
  limit: 10,
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatMoney(value) {
   if (typeof value !== 'number') return '—'
   return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value))}`
 }

 function extractMatchPercentage(text) {
     if (!text) return null
     const valueWithPercent = String(text).match(/(\d+)\s*%/i)
     if (valueWithPercent) return Math.min(100, Math.max(0, parseInt(valueWithPercent[1], 10)))
     const plainNumber = String(text).match(/\b(\d{1,3})\b/)
     if (plainNumber) {
       const parsed = parseInt(plainNumber[1], 10)
       if (parsed >= 1 && parsed <= 100) return parsed
     }
     return null
 }

  function estimateMatchPercentage(suggestion, query) {
    const explicit = extractMatchPercentage(suggestion?.reason)
    if (explicit !== null) return explicit

    const listing = suggestion?.listing || {}
    const q = String(query || '').toLowerCase().trim()
    if (!q) return 60

    const tokens = q
      .split(/[^a-zA-Zа-яА-ЯіІїЇєЄ0-9]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3)

    if (tokens.length === 0) return 60

    const haystack = [
      listing.title,
      listing.brand,
      listing.model,
      listing.description,
      suggestion?.reason,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matched = tokens.filter((token) => haystack.includes(token)).length
    const coverage = matched / tokens.length
    const estimated = Math.round(45 + coverage * 50)
    return Math.min(95, Math.max(20, estimated))
  }

 function getMatchBarColor(percentage) {
   if (percentage >= 75) return 'from-green-500 to-emerald-600'
   if (percentage >= 50) return 'from-blue-500 to-cyan-600'
   if (percentage >= 25) return 'from-amber-500 to-orange-600'
   return 'from-red-500 to-red-600'
}

export default function AIAssistant() {
  const { isDark } = useContext(ThemeContext)
  const { language } = useContext(LanguageContext)
  const location = useLocation()
  const t = translations[language] || translations.uk

  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (location.state?.aiAssistantResult) {
      setResult(location.state.aiAssistantResult)
      setError('')
      if (location.state.aiAssistantForm) {
        setForm((prev) => ({ ...prev, ...location.state.aiAssistantForm }))
      }
    }
  }, [location.state])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      query: form.query.trim() || null,
      limit: toNumberOrNull(form.limit) || 10,
    }

    const data = await getVehicleAiRecommendations(payload)
    if (data?.error) {
      setError(data.error)
      setResult(null)
    } else {
      setResult(data)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <section className={`rounded-3xl border p-6 shadow-sm ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.title}</h1>
        <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} md:col-span-2`}>
            {t.query}
            <textarea
              rows={3}
              value={form.query}
              onChange={(e) => updateField('query', e.target.value)}
              placeholder={t.queryPlaceholder}
              className={`rounded-xl border px-3 py-2 outline-none transition ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-sky-500' : 'border-slate-300 bg-white text-slate-900 focus:border-sky-500'}`}
            />
          </label>

          <div className="md:col-span-2">
            <button type="submit" disabled={loading} className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? t.loading : t.ask}
            </button>
          </div>
        </form>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

       {result ? (
         <section className="space-y-4">
           <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`}>
             <p className="mt-2 text-sm leading-6">{result.summary}</p>
           </div>

           <div className="grid gap-4 md:grid-cols-2">
             {(result.suggestions || []).map((suggestion) => {
               const listing = suggestion.listing || {}
               const matchPercentage = estimateMatchPercentage(suggestion, form.query)
               return (
                 <article key={listing.id} className={`rounded-2xl border p-4 shadow-sm ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                   {listing.coverPhoto ? <img src={listing.coverPhoto} alt={listing.title} className="h-44 w-full rounded-xl object-cover" /> : null}
                   <h3 className={`mt-3 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{listing.title || '—'}</h3>
                   <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{listing.brand || ''} {listing.model || ''}</p>
                   <p className="mt-2 text-base font-bold text-sky-700">{formatMoney(listing.price)}</p>
                   <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.year}: {listing.year ?? '—'} | {t.mileage}: {listing.mileage ?? '—'}</p>

                   {/* Match percentage bar */}
                   <div className="mt-4 space-y-1">
                     <div className="flex items-center justify-between">
                       <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.match}</span>
                       <span className={`text-sm font-bold text-sky-600`}>{matchPercentage}%</span>
                     </div>
                     <div className={`h-2 w-full rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'} overflow-hidden`}>
                       <div className={`h-full bg-gradient-to-r ${getMatchBarColor(matchPercentage)} transition-all duration-300`} style={{ width: `${matchPercentage}%` }} />
                     </div>
                   </div>

                   <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}><span className="font-semibold">{t.reason}:</span> {suggestion.reason}</p>
                   <Link
                     to={`/listings/${listing.id}`}
                     state={{
                       returnTo: '/ai-assistant',
                       aiAssistantResult: result,
                       aiAssistantForm: form,
                     }}
                     className="mt-3 inline-flex rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
                   >
                     {t.open}
                   </Link>
                 </article>
               )
             })}
           </div>
         </section>
      ) : (
        <div className={`rounded-2xl border p-6 text-center text-sm ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}>
          {t.noResults}
        </div>
      )}
    </div>
  )
}

