import React, { useEffect, useMemo, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { getListings, getRecommendations } from '../api/listings'
import { ThemeContext } from '../context/ThemeContext'
import { getFavorites, toggleFavoriteItem } from '../api/auth'
import { LanguageContext } from '../context/LanguageContext'
import { cleanListingTitle } from '../utils/listingTitle'
import { toCanonicalValue, translateValue } from '../utils/translations'

const CAR_CLASSES = ['Седан', 'Універсал', 'Хетчбек', 'Кросовер', 'Позашляховик', 'Мікровен', 'Купе', 'Кабріолет']
const MOTO_CLASSES = ['Спортбайк', 'Туристичний', 'Круізер', 'Ендуро', 'Кросовий', 'Мопед/Скутер', 'Нейкед']
const DEFAULT_WEIGHTS = { wPrice: 0.5, wYear: 0.3, wMileage: 0.2 }
const WEIGHT_PRESETS = {
  balanced: { wPrice: 0.5, wYear: 0.3, wMileage: 0.2 },
  budget: { wPrice: 0.7, wYear: 0.15, wMileage: 0.15 },
  fresh: { wPrice: 0.15, wYear: 0.7, wMileage: 0.15 },
  efficient: { wPrice: 0.2, wYear: 0.2, wMileage: 0.6 },
}
const WEIGHT_KEYS = ['wPrice', 'wYear', 'wMileage']

const translations = {
  uk: {
    eyebrow: 'Розумний підбір',
    recommendations: 'Рекомендації',
    adjustWeights: 'Налаштуйте ваги та фільтри, щоб ранжувати оголошення за своїми пріоритетами.',
    filters: 'Фільтри',
    vehicleType: 'Тип транспорту',
    vehicleTypeAll: 'Все',
    car: 'Авто',
    motorcycle: 'Мото',
    vehicleClass: 'Клас',
    allClasses: 'Усі класи',
    brand: 'Марка',
    anyBrand: 'Усі марки',
    maxPrice: 'Максимальна ціна',
    maxPricePlaceholder: 'Наприклад: 15000',
    weightDiagram: 'Діаграма ваг',
    price: 'Ціна',
    year: 'Рік',
    mileage: 'Пробіг',
    weightPrice: 'Вага ціни',
    weightYear: 'Вага року випуску',
    weightMileage: 'Вага пробігу',
    presets: 'Готові сценарії',
    presetBalanced: 'Баланс',
    presetBudget: 'Економія',
    presetFresh: 'Новіші',
    presetEfficient: 'Мінімум пробігу',
    activeSetup: 'Поточні налаштування',
    resultCount: 'Знайдено рекомендацій',
    updateRecommendations: 'Оновити рекомендації',
    reset: 'Скинути',
    loading: 'Завантаження рекомендацій…',
    noResults: 'Рекомендацій не знайдено.',
    open: 'Відкрити',
    close: 'Закрити',
    noPhoto: 'Фото відсутнє',
  },
  en: {
    eyebrow: 'Smart matching',
    recommendations: 'Recommendations',
    adjustWeights: 'Adjust weights and filters to rank listings by your priorities.',
    filters: 'Filters',
    vehicleType: 'Vehicle Type',
    vehicleTypeAll: 'All',
    car: 'Car',
    motorcycle: 'Motorcycle',
    vehicleClass: 'Class',
    allClasses: 'All classes',
    brand: 'Brand',
    anyBrand: 'All brands',
    maxPrice: 'Maximum price',
    maxPricePlaceholder: 'For example: 15000',
    weightDiagram: 'Weight Diagram',
    price: 'Price',
    year: 'Year',
    mileage: 'Mileage',
    weightPrice: 'Price Weight',
    weightYear: 'Year of manufacture weight',
    weightMileage: 'Mileage Weight',
    presets: 'Presets',
    presetBalanced: 'Balanced',
    presetBudget: 'Budget first',
    presetFresh: 'Newest first',
    presetEfficient: 'Low mileage',
    activeSetup: 'Current setup',
    resultCount: 'Recommendations found',
    updateRecommendations: 'Update Recommendations',
    reset: 'Reset',
    loading: 'Loading recommendations…',
    noResults: 'No recommendations found.',
    open: 'Open',
    close: 'Close',
    noPhoto: 'No photo',
  }
}

function normalizeWeights(weights) {
  const next = {
    wPrice: Number(weights?.wPrice) || 0,
    wYear: Number(weights?.wYear) || 0,
    wMileage: Number(weights?.wMileage) || 0,
  }
  const total = next.wPrice + next.wYear + next.wMileage
  if (total <= 0) return { ...DEFAULT_WEIGHTS }
  return {
    wPrice: +(next.wPrice / total).toFixed(4),
    wYear: +(next.wYear / total).toFixed(4),
    wMileage: +(next.wMileage / total).toFixed(4),
  }
}

function rebalanceWeights(currentWeights, changedKey, rawValue) {
  const nextValue = Math.min(1, Math.max(0, Number(rawValue) || 0))
  const current = normalizeWeights(currentWeights)
  const otherKeys = WEIGHT_KEYS.filter((key) => key !== changedKey)
  const remaining = Math.max(0, 1 - nextValue)
  const currentOtherTotal = otherKeys.reduce((sum, key) => sum + (current[key] || 0), 0)

  const next = { ...current, [changedKey]: nextValue }

  if (remaining === 0) {
    otherKeys.forEach((key) => {
      next[key] = 0
    })
    return normalizeWeights(next)
  }

  if (currentOtherTotal <= 0) {
    const even = remaining / otherKeys.length
    otherKeys.forEach((key) => {
      next[key] = even
    })
    return normalizeWeights(next)
  }

  otherKeys.forEach((key) => {
    next[key] = ((current[key] || 0) / currentOtherTotal) * remaining
  })

  return normalizeWeights(next)
}

function DonutChart({ values, colors, size = 140, strokeWidth = 18, isDark }) {
  const total = values.reduce((s, v) => s + v, 0)
  const perc = total > 0 ? values.map((v) => v / total) : [0, 0, 0]
  const r = (size - strokeWidth) / 2
  const C = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <g transform={`translate(${size / 2},${size / 2}) rotate(-90)`}>
        {perc.map((p, i) => {
          const dash = +(p * C).toFixed(3)
          const dasharr = `${dash} ${C - dash}`
          const dashoff = -offset
          offset += dash
          return <circle key={i} r={r} fill="transparent" stroke={colors[i]} strokeWidth={strokeWidth} strokeLinecap="butt" strokeDasharray={dasharr} strokeDashoffset={dashoff} style={{ transition: 'stroke-dasharray 450ms, stroke-dashoffset 450ms' }} />
        })}
        <circle r={r} fill="transparent" stroke={isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.05)'} strokeWidth={strokeWidth} />
      </g>
    </svg>
  )
}

function RecommendationCard({ item, isDark, t }) {
  const displayTitle = cleanListingTitle(item.title)
  const [isFavorite, setIsFavorite] = useState(() => {
    const favorites = getFavorites()
    return favorites.some((fav) => fav.id === item.id)
  })

  function toggleFavorite(e) {
    e.preventDefault()
    const nextState = toggleFavoriteItem(item)
    setIsFavorite(nextState)
  }

  return (
    <Link to={`/listings/${item.id}`} className={`block rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md relative group`}>
      <button
        type="button"
        onClick={toggleFavorite}
        className={`absolute top-5 right-5 z-10 rounded-full p-2 transition ${
          isFavorite
            ? 'bg-red-500 text-white'
            : isDark
              ? 'bg-slate-700 text-slate-300 group-hover:bg-red-500 group-hover:text-white'
              : 'bg-slate-100 text-slate-600 group-hover:bg-red-500 group-hover:text-white'
        }`}
        aria-label="Toggle favorite"
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>

      <div className="mb-4 overflow-hidden rounded-2xl bg-slate-100">
        {Array.isArray(item.photoUrls) && item.photoUrls[0] ? (
          <img src={item.photoUrls[0]} alt={displayTitle} className="h-52 w-full object-cover" />
        ) : (
          <div className={`flex h-52 items-center justify-center text-sm ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{t.noPhoto}</div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{displayTitle}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.vehicleType === 'motorcycle' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
              {item.vehicleType === 'motorcycle' ? t.motorcycle : t.car}
            </span>
          </div>
          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.brand} {item.model} • {item.year} • {item.mileage} км</div>
        </div>
        <div className="text-xl font-bold text-sky-700">${item.price}</div>
      </div>
      <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>
    </Link>
  )
}

function RecommendationsFiltersPanel({
  isModal = false,
  isDark,
  language,
  t,
  vehicleType,
  vehicleClass,
  brand,
  maxPrice,
  weights,
  brandOptions,
  showFiltersModal,
  setShowFiltersModal,
  setVehicleType,
  setVehicleClass,
  setBrand,
  setMaxPrice,
  resetAll,
  load,
}) {
  const classOptions = !vehicleType
    ? [...new Set([...CAR_CLASSES, ...MOTO_CLASSES])].sort((a, b) => String(a).localeCompare(String(b), 'uk'))
    : vehicleType === 'motorcycle'
      ? MOTO_CLASSES
      : CAR_CLASSES

  const segmentTranslate = vehicleType === 'car'
    ? 'translateX(0)'
    : vehicleType === 'motorcycle'
      ? 'translateX(calc(200% + 16px))'
      : 'translateX(calc(100% + 8px))'

  return (
    <div className={isModal ? 'p-2' : ''} role={isModal ? 'dialog' : undefined} aria-modal={isModal ? 'true' : undefined}>
      <div className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.filters}</div>
      <div className={`overflow-y-auto max-h-96 space-y-4 pr-2 ${isDark ? 'scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700' : 'scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100'}`}>
        <div className="mb-4">
          <div className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.vehicleType}</div>
          <div className={`relative grid grid-cols-3 gap-1 rounded-2xl p-1 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
            <span
              className="absolute inset-y-1 left-1 w-[calc((100%-16px)/3)] rounded-xl bg-sky-500 shadow-md transition-transform duration-300 ease-in-out"
              style={{ width: 'calc((100% - 16px) / 3)', transform: segmentTranslate }}
            />
            <button type="button" aria-pressed={vehicleType === 'car'} onClick={() => { setVehicleType('car'); setVehicleClass(''); setBrand(''); load({ vehicleType: 'car', vehicleClass: '', brand: '', maxPrice, weights }) }} className={`relative z-10 rounded-xl px-3 py-2 text-sm transition ${vehicleType === 'car' ? 'text-white' : isDark ? 'text-slate-200' : 'text-slate-600'}`}>{t.car}</button>
            <button type="button" aria-pressed={!vehicleType} onClick={() => { setVehicleType(''); setVehicleClass(''); setBrand(''); load({ vehicleType: '', vehicleClass: '', brand: '', maxPrice, weights }) }} className={`relative z-10 rounded-xl px-3 py-2 text-sm transition ${!vehicleType ? 'text-white' : isDark ? 'text-slate-200' : 'text-slate-600'}`}>{t.vehicleTypeAll}</button>
            <button type="button" aria-pressed={vehicleType === 'motorcycle'} onClick={() => { setVehicleType('motorcycle'); setVehicleClass(''); setBrand(''); load({ vehicleType: 'motorcycle', vehicleClass: '', brand: '', maxPrice, weights }) }} className={`relative z-10 rounded-xl px-3 py-2 text-sm transition ${vehicleType === 'motorcycle' ? 'text-white' : isDark ? 'text-slate-200' : 'text-slate-600'}`}>{t.motorcycle}</button>
          </div>
        </div>

        <div className="mb-4">
          <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.vehicleClass}</label>
          <select value={vehicleClass} onChange={(e) => { const nextClass = e.target.value; setVehicleClass(nextClass); load({ vehicleType, vehicleClass: nextClass, brand, maxPrice, weights }) }} className={`w-full rounded-xl px-4 py-3 transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white' : 'border border-slate-300 bg-white text-slate-900'}`}>
            <option value="">{t.allClasses}</option>
            {classOptions.map((itemClass) => (
              <option key={itemClass} value={itemClass}>{translateValue(itemClass, language)}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.brand}</label>
          <select value={brand} onChange={(e) => { const nextBrand = e.target.value; setBrand(nextBrand); load({ vehicleType, vehicleClass, brand: nextBrand, maxPrice, weights }) }} className={`w-full rounded-xl px-4 py-3 transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white' : 'border border-slate-300 bg-white text-slate-900'}`}>
            <option value="">{t.anyBrand}</option>
            {brandOptions.map((brandOption) => (
              <option key={brandOption} value={brandOption}>{brandOption}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.maxPrice}</label>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder={t.maxPricePlaceholder}
            className={`w-full rounded-xl px-4 py-3 transition outline-none ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 bg-white text-slate-900 focus:border-sky-500'}`}
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => { load({ vehicleType, vehicleClass, brand, maxPrice, weights }); if (isModal && showFiltersModal) setShowFiltersModal(false) }} className="flex-1 rounded-xl bg-sky-600 px-3 py-2 text-white text-sm transition hover:bg-sky-700">{t.updateRecommendations}</button>
          <button type="button" onClick={() => { resetAll(); if (isModal && showFiltersModal) setShowFiltersModal(false) }} className={`flex-1 rounded-xl px-3 py-2 text-sm transition ${isDark ? 'bg-slate-700 text-white border border-slate-600 hover:bg-slate-600' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{t.reset}</button>
        </div>
      </div>
    </div>
  )
}

export default function Recommendations(){
  const { isDark } = useContext(ThemeContext)
  const { language } = useContext(LanguageContext)
  const t = translations[language] || translations['uk']

  const [catalogItems, setCatalogItems] = useState([])
  const [items, setItems] = useState([])
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleClass, setVehicleClass] = useState('')
  const [brand, setBrand] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  const brandOptions = useMemo(() => {
    return [...new Set(
      catalogItems
        .filter((item) => !vehicleType || String(item?.vehicleType || '').toLowerCase() === vehicleType)
        .map((item) => item?.brand)
        .filter(Boolean)
    )].sort((a, b) => String(a).localeCompare(String(b), language === 'uk' ? 'uk' : 'en'))
  }, [catalogItems, language, vehicleType])

  useEffect(() => {
    let mounted = true
    getListings().then((data) => {
      if (!mounted) return
      setCatalogItems(Array.isArray(data) ? data : [])
    })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    load({
      weights: DEFAULT_WEIGHTS,
      vehicleType: '',
      vehicleClass: '',
      brand: '',
      maxPrice: '',
    })
  }, [])

  async function load(opts = {}){
    setLoading(true); setError('')
    const nextWeights = normalizeWeights(opts.weights ?? weights)
    const vt = opts.vehicleType ?? vehicleType
    const cls = opts.vehicleClass !== undefined ? opts.vehicleClass : vehicleClass
    const nextBrand = opts.brand !== undefined ? opts.brand : brand
    const nextMaxPrice = opts.maxPrice !== undefined ? opts.maxPrice : maxPrice
    const params = {
      limit: 300,
      wPrice: nextWeights.wPrice,
      wYear: nextWeights.wYear,
      wMileage: nextWeights.wMileage,
      ...(vt ? { vehicleType: vt } : {}),
      ...(cls ? { bodyType: cls } : {}),
      ...(nextBrand ? { brand: nextBrand } : {}),
      ...(nextMaxPrice !== '' ? { maxPrice: Number(nextMaxPrice) } : {}),
    }
    const data = await getRecommendations(params)
    if (data?.error){
      setError(data.error)
      setItems([])
      setLoading(false)
      return
    }

    const normalizedClass = toCanonicalValue(cls)
    const filtered = (Array.isArray(data) ? data : []).filter((item) => {
      const typeMatches = !vt || String(item?.vehicleType || '').toLowerCase() === vt
      if (!typeMatches) return false
      if (!normalizedClass) return true
      return toCanonicalValue(item?.bodyType) === normalizedClass
    })

    setItems(filtered)
    setLoading(false)
  }

  async function applyWeights(e){ e?.preventDefault(); await load({ weights, vehicleType, vehicleClass, brand, maxPrice }) }

  function applyPreset(presetKey) {
    const nextWeights = normalizeWeights(WEIGHT_PRESETS[presetKey] || DEFAULT_WEIGHTS)
    setWeights(nextWeights)
    load({ weights: nextWeights, vehicleType, vehicleClass, brand, maxPrice })
  }

  function resetAll() {
    setWeights(DEFAULT_WEIGHTS)
    setVehicleType('')
    setVehicleClass('')
    setBrand('')
    setMaxPrice('')
    load({ weights: DEFAULT_WEIGHTS, vehicleType: '', vehicleClass: '', brand: '', maxPrice: '' })
  }

  function handleWeightChange(key, value) {
    setWeights((prev) => rebalanceWeights(prev, key, value))
  }

  return (
    <div className={`space-y-8 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
      <section className={`rounded-3xl p-6 shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">{t.eyebrow}</p>
            <h1 className={`mt-2 text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.recommendations}</h1>
            <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.adjustWeights}</p>
          </div>
        </div>
      </section>

      <div className="lg:grid lg:grid-cols-3 lg:gap-6 flex flex-col">
        <div className="lg:col-span-2 space-y-6">
          <div className={`rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4 sm:p-6 shadow-sm`}>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.recommendations}</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-700/60' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.activeSetup}</div>
                <div className={`mt-2 text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{vehicleType === 'motorcycle' ? t.motorcycle : vehicleType === 'car' ? t.car : t.vehicleTypeAll}{vehicleClass ? ` • ${translateValue(vehicleClass, language)}` : ''}</div>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-700/60' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.brand}</div>
                <div className={`mt-2 text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{brand || t.anyBrand}</div>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-700/60' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.maxPrice}</div>
                <div className={`mt-2 text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{maxPrice ? `$${maxPrice}` : '—'}</div>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-700/60' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.resultCount}</div>
                <div className={`mt-2 text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{items.length}</div>
              </div>
            </div>

            <form onSubmit={applyWeights} className="mt-6 grid gap-6 lg:grid-cols-3 items-start">
              <div className="lg:col-span-1 flex flex-col items-center gap-4">
                <div className={`w-full max-w-xs rounded-xl p-4 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <div className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.weightDiagram}</div>
                  <DonutChart values={[weights.wPrice, weights.wYear, weights.wMileage]} colors={["#06b6d4","#10b981","#f59e0b"]} isDark={isDark} />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                    <div className="flex flex-col items-center"><span className="w-3 h-3 rounded-full" style={{background:'#06b6d4'}}></span><span className={`mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.price}</span><span className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{Math.round(weights.wPrice * 100)}%</span></div>
                    <div className="flex flex-col items-center"><span className="w-3 h-3 rounded-full" style={{background:'#10b981'}}></span><span className={`mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.year}</span><span className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{Math.round(weights.wYear * 100)}%</span></div>
                    <div className="flex flex-col items-center"><span className="w-3 h-3 rounded-full" style={{background:'#f59e0b'}}></span><span className={`mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.mileage}</span><span className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{Math.round(weights.wMileage * 100)}%</span></div>
                  </div>
                </div>

                <div className={`w-full rounded-xl p-4 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <div className={`text-sm font-medium mb-3 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.presets}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => applyPreset('balanced')} className={`rounded-xl px-3 py-2 text-sm transition ${isDark ? 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-600' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}>{t.presetBalanced}</button>
                    <button type="button" onClick={() => applyPreset('budget')} className={`rounded-xl px-3 py-2 text-sm transition ${isDark ? 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-600' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}>{t.presetBudget}</button>
                    <button type="button" onClick={() => applyPreset('fresh')} className={`rounded-xl px-3 py-2 text-sm transition ${isDark ? 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-600' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}>{t.presetFresh}</button>
                    <button type="button" onClick={() => applyPreset('efficient')} className={`rounded-xl px-3 py-2 text-sm transition ${isDark ? 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-600' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}>{t.presetEfficient}</button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="grid gap-4">
                  <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.weightPrice}<div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{weights.wPrice.toFixed(2)}</div>
                    <input aria-label={t.weightPrice} type="range" min={0} max={1} step={0.01} value={weights.wPrice} onChange={e => handleWeightChange('wPrice', e.target.value)} className="w-full" />
                  </label>
                  <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.weightYear}<div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{weights.wYear.toFixed(2)}</div>
                    <input aria-label={t.weightYear} type="range" min={0} max={1} step={0.01} value={weights.wYear} onChange={e => handleWeightChange('wYear', e.target.value)} className="w-full" />
                  </label>
                  <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.weightMileage}<div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{weights.wMileage.toFixed(2)}</div>
                    <input aria-label={t.weightMileage} type="range" min={0} max={1} step={0.01} value={weights.wMileage} onChange={e => handleWeightChange('wMileage', e.target.value)} className="w-full" />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 items-end">
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <button aria-label={t.updateRecommendations} className="flex-1 rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white text-sm sm:text-base hover:bg-sky-700 transition">{t.updateRecommendations}</button>
                    <button type="button" onClick={resetAll} className={`flex-1 rounded-xl px-4 py-3 text-sm transition ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}>{t.reset}</button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {loading ? (
            <div className={`rounded-2xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>{t.loading}</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <RecommendationCard key={item.id} item={item} isDark={isDark} t={t} />
              ))}
              {!items.length && <div className={`rounded-2xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>{t.noResults}</div>}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className={`sticky top-24 rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4 shadow-sm hidden lg:block`}>
            <RecommendationsFiltersPanel
              isDark={isDark}
              language={language}
              t={t}
              vehicleType={vehicleType}
              vehicleClass={vehicleClass}
              brand={brand}
              maxPrice={maxPrice}
              weights={weights}
              brandOptions={brandOptions}
              showFiltersModal={showFiltersModal}
              setShowFiltersModal={setShowFiltersModal}
              setVehicleType={setVehicleType}
              setVehicleClass={setVehicleClass}
              setBrand={setBrand}
              setMaxPrice={setMaxPrice}
              resetAll={resetAll}
              load={load}
            />
          </div>
          <button onClick={()=>setShowFiltersModal(true)} className="lg:hidden fixed bottom-6 right-4 z-40 rounded-full bg-sky-600 p-3 text-white shadow-lg hover:bg-sky-700 transition" aria-label={t.open}>{t.filters}</button>
        </div>
      </div>

      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowFiltersModal(false)} aria-hidden="true"></div>
          <div className="relative w-full max-w-md p-4">
            <div className={`rounded-xl p-4 shadow-lg ${isDark ? 'bg-slate-800 text-white' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold">{t.filters}</div>
                <button onClick={()=>setShowFiltersModal(false)} aria-label={t.close} className={`text-lg transition ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>✕</button>
              </div>
              <RecommendationsFiltersPanel
                isModal={true}
                isDark={isDark}
                language={language}
                t={t}
                vehicleType={vehicleType}
                vehicleClass={vehicleClass}
                brand={brand}
                maxPrice={maxPrice}
                weights={weights}
                brandOptions={brandOptions}
                showFiltersModal={showFiltersModal}
                setShowFiltersModal={setShowFiltersModal}
                setVehicleType={setVehicleType}
                setVehicleClass={setVehicleClass}
                setBrand={setBrand}
                setMaxPrice={setMaxPrice}
                resetAll={resetAll}
                load={load}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


