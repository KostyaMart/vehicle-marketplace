import React, { useEffect, useMemo, useState, useContext } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getListing } from '../api/listings'
import { getFavorites, toggleFavoriteItem } from '../api/auth'
import { ThemeContext } from '../context/ThemeContext'
import { LanguageContext } from '../context/LanguageContext'
import { translateDescription, translateValue } from '../utils/translations'

// ── label translations ────────────────────────────────────────────────────────
const LABELS = {
  uk: {
    detailsTag:     'Деталі оголошення',
    price:          'Ціна',
    brand:          'Марка',
    model:          'Модель',
    year:           'Рік',
    mileage:        'Пробіг',
    city:           'Місто',
    condition:      'Стан',
    fuelType:       'Тип палива',
    transmission:   'Трансмісія',
    bodyType:       'Тип кузова',
    color:          'Колір',
    driveType:      'Привід',
    engineVolume:   "Об'єм двигуна",
    ownersCount:    'Власників',
    customsCleared: 'Розмитнений',
    added:          'Додано',
    yes:            'Так',
    no:             'Ні',
    noPhoto:        'Фото відсутнє',
    loading:        'Завантаження оголошення…',
    notFound:       'Оголошення не знайдено.',
    backCatalog:    '← Повернутися до каталогу',
    backAI:         '← Повернутися до рекомендацій',
  },
  en: {
    detailsTag:     'Listing Details',
    price:          'Price',
    brand:          'Brand',
    model:          'Model',
    year:           'Year',
    mileage:        'Mileage',
    city:           'City',
    condition:      'Condition',
    fuelType:       'Fuel Type',
    transmission:   'Transmission',
    bodyType:       'Body Type',
    color:          'Color',
    driveType:      'Drive Type',
    engineVolume:   'Engine Volume',
    ownersCount:    'Owners',
    customsCleared: 'Customs Cleared',
    added:          'Added',
    yes:            'Yes',
    no:             'No',
    noPhoto:        'No photo',
    loading:        'Loading listing…',
    notFound:       'Listing not found.',
    backCatalog:    '← Back to catalog',
    backAI:         '← Back to recommendations',
  },
}

function formatMoney(value) {
  if (typeof value !== 'number') return '—'
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value))}`
}

function formatMileage(value, lang) {
  if (typeof value !== 'number') return '—'
  const locale = lang === 'uk' ? 'uk-UA' : 'en-US'
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(value))} ${lang === 'uk' ? 'км' : 'km'}`
}

function DetailRow({ label, value, isDark }) {
  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
      <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
      <div className={`mt-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value ?? '—'}</div>
    </div>
  )
}

export default function ListingDetails() {
  const { isDark } = useContext(ThemeContext)
  const { language } = useContext(LanguageContext)
  const t = LABELS[language] || LABELS['uk']
  const tv = (v) => translateValue(v, language)

  const { id } = useParams()
  const location = useLocation()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true); setError('')
      const data = await getListing(id)
      if (!mounted) return
      if (data?.error) { setError(data.error); setListing(null) }
      else { setListing(data); setActiveIndex(0) }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [id])

  const photos = useMemo(() => {
    if (!listing) return []
    return Array.isArray(listing.photoUrls) ? listing.photoUrls.filter(Boolean) : []
  }, [listing])

  const activePhoto = photos[activeIndex] || ''
  const returnTo = location.state?.returnTo || '/listings'
  const returnState = location.state?.aiAssistantResult
    ? { aiAssistantResult: location.state.aiAssistantResult, aiAssistantForm: location.state.aiAssistantForm }
    : undefined

  useEffect(() => {
    if (!listing?.id) return
    setIsFavorite(getFavorites().some((fav) => fav.id === listing.id))
  }, [listing])

  function toggleFavorite() {
    if (!listing) return
    setIsFavorite(toggleFavoriteItem(listing))
  }

  function goPrev() { if (photos.length) setActiveIndex((i) => (i - 1 + photos.length) % photos.length) }
  function goNext() { if (photos.length) setActiveIndex((i) => (i + 1) % photos.length) }

  if (loading) return <div className={`rounded-2xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>{t.loading}</div>
  if (error)   return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
  if (!listing) return <div className={`rounded-2xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>{t.notFound}</div>

  const returnLabel = returnTo === '/ai-assistant' ? t.backAI : t.backCatalog

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link
          to={returnTo} state={returnState}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
        >
          {returnLabel}
        </Link>
        <div className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ID: {listing.id}</div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        {/* Photo block */}
        <div className={`rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4 shadow-sm`}>
          <div className={`relative overflow-hidden rounded-3xl ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
            {activePhoto
              ? <img src={activePhoto} alt={listing.title} className="h-64 sm:h-[420px] w-full object-cover" />
              : <div className={`flex h-64 sm:h-[420px] items-center justify-center text-sm ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{t.noPhoto}</div>
            }
            {photos.length > 1 && (
              <>
                <button type="button" onClick={goPrev} className={`absolute left-4 top-1/2 -translate-y-1/2 rounded-full px-3 sm:px-4 py-2 text-sm font-semibold shadow transition ${isDark ? 'bg-slate-700/90 text-white hover:bg-slate-600' : 'bg-white/90 text-slate-900 hover:bg-white'}`}>‹</button>
                <button type="button" onClick={goNext} className={`absolute right-4 top-1/2 -translate-y-1/2 rounded-full px-3 sm:px-4 py-2 text-sm font-semibold shadow transition ${isDark ? 'bg-slate-700/90 text-white hover:bg-slate-600' : 'bg-white/90 text-slate-900 hover:bg-white'}`}>›</button>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-6">
              {photos.map((photo, index) => (
                <button key={`${photo}-${index}`} type="button" onClick={() => setActiveIndex(index)}
                  className={['overflow-hidden rounded-2xl border-2 transition', index === activeIndex ? 'border-sky-500' : isDark ? 'border-transparent opacity-60 hover:opacity-100' : 'border-transparent opacity-80 hover:opacity-100'].join(' ')}>
                  <img src={photo} alt={`${listing.title} ${index + 1}`} className="h-16 sm:h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info sidebar */}
        <aside className={`space-y-4 rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-6 shadow-sm`}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">{t.detailsTag}</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{listing.title}</h1>
              <button type="button" onClick={toggleFavorite}
                className={`rounded-full p-2 transition ${isFavorite ? 'bg-red-500 text-white' : isDark ? 'bg-slate-700 text-slate-300 hover:bg-red-500 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white'}`}
                aria-label="Toggle favorite">
                {isFavorite ? '❤️' : '🤍'}
              </button>
            </div>
            <p className={`mt-2 text-xs sm:text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{translateDescription(listing.description, language)}</p>
          </div>

          <div className={`rounded-3xl p-5 text-white ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}>
            <div className="text-slate-300 text-sm">{t.price}</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold">{formatMoney(listing.price)}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailRow label={t.brand}     value={listing.brand}                              isDark={isDark} />
            <DetailRow label={t.model}     value={listing.model}                              isDark={isDark} />
            <DetailRow label={t.year}      value={listing.year}                               isDark={isDark} />
            <DetailRow label={t.mileage}   value={formatMileage(listing.mileage, language)}   isDark={isDark} />
            <DetailRow label={t.city}      value={listing.city}                               isDark={isDark} />
            <DetailRow label={t.condition} value={tv(listing.condition)}                      isDark={isDark} />
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <DetailRow label={t.fuelType}       value={tv(listing.fuelType)}                                                    isDark={isDark} />
        <DetailRow label={t.transmission}   value={tv(listing.transmission)}                                                isDark={isDark} />
        <DetailRow label={t.bodyType}       value={tv(listing.bodyType)}                                                    isDark={isDark} />
        <DetailRow label={t.color}          value={tv(listing.color)}                                                       isDark={isDark} />
        <DetailRow label={t.driveType}      value={tv(listing.driveType)}                                                   isDark={isDark} />
        <DetailRow label={t.engineVolume}   value={listing.engineVolume ? `${listing.engineVolume} л` : '—'}                isDark={isDark} />
        <DetailRow label={t.ownersCount}    value={listing.ownersCount}                                                     isDark={isDark} />
        <DetailRow label={t.customsCleared} value={listing.customsCleared == null ? '—' : listing.customsCleared ? t.yes : t.no} isDark={isDark} />
        <DetailRow label={t.added}          value={listing.createdAt ? new Date(listing.createdAt).toLocaleString(language === 'uk' ? 'uk-UA' : 'en-GB') : '—'} isDark={isDark} />
      </section>
    </div>
  )
}

