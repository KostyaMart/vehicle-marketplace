import React, { useEffect, useMemo, useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getListings, getPublicStats } from './api/listings'
import { ThemeContext } from './context/ThemeContext'
import { getFavorites, toggleFavoriteItem } from './api/auth'
import { LanguageContext } from './context/LanguageContext'
import { cleanListingTitle } from './utils/listingTitle'

const translations = {
   uk: {
 	heroEyebrow: 'Маркетплейс транспорту',
 	heroTitle: 'Знайди транспорт під свої критерії за кілька кліків',
 	heroDesc: 'Каталог оголошень, рекомендації за вагами та фільтрами та багато іншого для швидкого пошуку ідеального авто чи мото.',
 	statsUsers: 'Користувачі',
 	statsListings: 'Оголошення',
 	statsCars: 'Авто',
 	statsMoto: 'Мото',
	searchPlaceholder: 'Пошук: марка, модель, опис...',
	searchButton: 'Пошук',
	recommended: 'Рекомендуємо',
	verifiedDealers: 'Перевірені продавці',
	dealerType: 'Автосалон',
	dealerRating: 'Рейтинг',
	listings: 'Оголошення',
	sellTitle: 'Хочете продати транспорт?',
	sellDesc: 'Розмістіть оголошення безкоштовно та знайдіть покупця швидко',
	sellButton: 'Подати оголошення',
	footerText: 'Маркетплейс транспорту',
	addToFavorites: 'Додати до обраного',
	noPhoto: 'Фото відсутнє',
	year: 'Рік',
	mileage: 'Пробіг',
	brand: 'Марка',
  },
   en: {
 	heroEyebrow: 'Vehicle Marketplace',
 	heroTitle: 'Find the vehicle that matches your criteria in a few clicks',
 	heroDesc: 'A listings catalog, weighted recommendations, filters, and more for quickly finding the perfect car or motorcycle.',
 	statsUsers: 'Users',
 	statsListings: 'Listings',
 	statsCars: 'Cars',
 	statsMoto: 'Motorcycles',
	searchPlaceholder: 'Search: brand, model, description...',
	searchButton: 'Search',
	recommended: 'Recommended',
	verifiedDealers: 'Verified Dealers',
	dealerType: 'Dealership',
	dealerRating: 'Rating',
	listings: 'Listings',
	sellTitle: 'Want to sell a vehicle?',
	sellDesc: 'Post a listing for free and find a buyer quickly',
	sellButton: 'Post a listing',
	footerText: 'Vehicle Marketplace',
	addToFavorites: 'Add to favorites',
	noPhoto: 'No photo',
	year: 'Year',
	mileage: 'Mileage',
	brand: 'Brand',
  },
}

const INITIAL_FILTERS = {
  query: '',
  brand: '',
  model: '',
  priceMin: '',
  priceMax: '',
  yearMin: '',
  yearMax: '',
  mileageMin: '',
  mileageMax: '',
  sort: 'relevance',
  fuelType: '',
  transmission: '',
  bodyType: '',
  color: '',
  driveType: '',
  condition: '',
  engineVolMin: '',
  engineVolMax: '',
  ownersCount: '',
  city: '',
  customsCleared: false,
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'За релевантністю' },
  { value: 'price-asc', label: 'Спочатку дешевші' },
  { value: 'price-desc', label: 'Спочатку дорожчі' },
  { value: 'year-desc', label: 'Спочатку новіші' },
  { value: 'mileage-asc', label: 'Спочатку з меншим пробігом' },
]

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
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

function formatMileage(value) {
  if (typeof value !== 'number') return '—'
  return `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(Math.round(value))} км`
}

function sortListings(items, sort) {
  const list = [...items]

  switch (sort) {
	case 'price-asc':
	  return list.sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY))
	case 'price-desc':
	  return list.sort((a, b) => (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY))
	case 'year-desc':
	  return list.sort((a, b) => (b.year ?? Number.NEGATIVE_INFINITY) - (a.year ?? Number.NEGATIVE_INFINITY))
	case 'mileage-asc':
	  return list.sort((a, b) => (a.mileage ?? Number.POSITIVE_INFINITY) - (b.mileage ?? Number.POSITIVE_INFINITY))
	default:
	  return list
  }
}

function createdAtTs(item) {
  const ts = new Date(item?.createdAt || 0).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function modelGroupKey(item) {
  return `${String(item?.brand || '').toLowerCase()}|${String(item?.model || '').toLowerCase()}`
}

function pickDiverseListings(items, limit) {
  if (!Array.isArray(items) || items.length === 0 || limit <= 0) return []

  const sorted = [...items].sort((a, b) => {
	const byDate = createdAtTs(b) - createdAtTs(a)
	if (byDate !== 0) return byDate
	return (Number(b?.id) || 0) - (Number(a?.id) || 0)
  })

  const groups = new Map()
  for (const item of sorted) {
	const key = modelGroupKey(item)
	if (!groups.has(key)) groups.set(key, [])
	groups.get(key).push(item)
  }

  const keys = [...groups.keys()].sort((a, b) => {
	const aHead = groups.get(a)?.[0]
	const bHead = groups.get(b)?.[0]
	return createdAtTs(bHead) - createdAtTs(aHead)
  })

  const result = []
  let shift = 0
  while (result.length < limit) {
	let progressed = false
	for (let i = 0; i < keys.length && result.length < limit; i += 1) {
	  const key = keys[(i + shift) % keys.length]
	  const bucket = groups.get(key)
	  if (!bucket || bucket.length === 0) continue
	  result.push(bucket.shift())
	  progressed = true
	}
	if (!progressed) break
	shift = (shift + 1) % Math.max(1, keys.length)
  }

  return result
}

function ListingCard({ item, isDark, t }) {
  const cover = Array.isArray(item.photoUrls) && item.photoUrls.length > 0 ? item.photoUrls[0] : ''
  const displayTitle = cleanListingTitle(item.title)
  const [isFavorite, setIsFavorite] = React.useState(() => {
	const favorites = getFavorites()
	return favorites.some(fav => fav.id === item.id)
  })

  const toggleFavorite = (e) => {
	e.preventDefault()
	const next = toggleFavoriteItem(item)
	setIsFavorite(next)
  }

  return (
	<Link to={`/listings/${item.id}`} className={`block rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md relative group`}>
	  <button
		onClick={toggleFavorite}
		className={`absolute top-4 right-4 z-10 rounded-full p-2 transition ${
		  isFavorite
			? 'bg-red-500 text-white'
			: isDark ? 'bg-slate-700 text-slate-300 group-hover:bg-red-500 group-hover:text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-red-500 group-hover:text-white'
		}`}
		aria-label={t.addToFavorites}
	  >
		{isFavorite ? '❤️' : '🤍'}
	  </button>

	  <div className="mb-4 overflow-hidden rounded-2xl bg-slate-100">
		{cover ? (
		  <img src={cover} alt={displayTitle} className="h-40 sm:h-52 w-full object-cover" />
		) : (
		  <div className={`flex h-40 sm:h-52 items-center justify-center text-sm ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{t.noPhoto}</div>
		)}
	  </div>

	  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
		<div className="flex-1 min-w-0">
		  <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
			{item.brand} · {item.model}
		  </p>
		  <h3 className={`mt-1 text-base sm:text-lg font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{displayTitle}</h3>
		</div>
		<div className={`rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
		  {formatMoney(item.price)}
		</div>
	  </div>

	  <p className={`mt-3 line-clamp-3 text-xs sm:text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>

	  <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
		<div className={`rounded-xl p-2 sm:p-3 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
		  <dt className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t.year}</dt>
		  <dd className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.year ?? '—'}</dd>
		</div>
		<div className={`rounded-xl p-2 sm:p-3 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
		  <dt className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t.mileage}</dt>
		  <dd className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatMileage(item.mileage)}</dd>
		</div>
		<div className={`rounded-xl p-2 sm:p-3 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
		  <dt className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t.brand}</dt>
		  <dd className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.brand}</dd>
		</div>
	  </dl>
	</Link>
  )
}

function FilterField({ label, children }) {
  return (
	<label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
	  <span>{label}</span>
	  {children}
	</label>
  )
}

export default function App() {
   const { isDark } = useContext(ThemeContext)
   const { language } = useContext(LanguageContext)
   const t = translations[language] || translations.uk
   const [listings, setListings] = useState([])
   const [publicStats, setPublicStats] = useState(null)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState('')
   const [filters, setFilters] = useState(INITIAL_FILTERS)
   const navigate = useNavigate()

   useEffect(() => {
 	let mounted = true

 	async function load() {
 	  setLoading(true)
 	  setError('')
 	  const [dataListings, dataStats] = await Promise.all([
 	    getListings(),
 	    getPublicStats()
 	  ])
 	  if (!mounted) return

 	  if (dataListings?.error) {
 		setError(dataListings.error)
 		setListings([])
 	  } else {
 		setListings(Array.isArray(dataListings) ? dataListings : [])
 	  }

 	  if (dataStats?.error) {
 		setPublicStats(null)
 	  } else {
 		setPublicStats(dataStats)
 	  }

 	  setLoading(false)
 	}

 	load()
 	return () => {
 	  mounted = false
 	}
   }, [])

  const brandOptions = useMemo(() => {
	return [...new Set(listings.map((item) => item.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'uk'))
  }, [listings])

  const modelOptions = useMemo(() => {
	const source = filters.brand ? listings.filter((item) => item.brand === filters.brand) : listings
	return [...new Set(source.map((item) => item.model).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'uk'))
  }, [filters.brand, listings])

  const fuelOptions = useMemo(() => {
	return [...new Set(listings.map((i) => i.fuelType).filter(Boolean))]
	  .sort((a,b) => String(a).localeCompare(String(b), 'uk'))
  }, [listings])

  const transmissionOptions = useMemo(() => {
	return [...new Set(listings.map((i) => i.transmission).filter(Boolean))].sort()
  }, [listings])

  const bodyOptions = useMemo(() => {
	return [...new Set(listings.map((i) => i.bodyType).filter(Boolean))].sort()
  }, [listings])

  const colorOptions = useMemo(() => {
	return [...new Set(listings.map((i) => i.color).filter(Boolean))].sort()
  }, [listings])

  const driveOptions = useMemo(() => {
	return [...new Set(listings.map((i) => i.driveType).filter(Boolean))].sort()
  }, [listings])

  const conditionOptions = useMemo(() => {
	return [...new Set(listings.map((i) => i.condition).filter(Boolean))].sort()
  }, [listings])

  const cityOptions = useMemo(() => {
	return [...new Set(listings.map((i) => i.city).filter(Boolean))].sort((a,b) => String(a).localeCompare(String(b), 'uk'))
  }, [listings])

  const filtered = useMemo(() => {
	const query = normalizeText(filters.query)
	const brand = normalizeText(filters.brand)
	const model = normalizeText(filters.model)
	const priceMin = toNumberOrNull(filters.priceMin)
	const priceMax = toNumberOrNull(filters.priceMax)
	const yearMin = toNumberOrNull(filters.yearMin)
	const yearMax = toNumberOrNull(filters.yearMax)
	const mileageMin = toNumberOrNull(filters.mileageMin)
	const mileageMax = toNumberOrNull(filters.mileageMax)

	const fuelType = normalizeText(filters.fuelType)
	const transmission = normalizeText(filters.transmission)
	const bodyType = normalizeText(filters.bodyType)
	const color = normalizeText(filters.color)
	const driveType = normalizeText(filters.driveType)
	const condition = normalizeText(filters.condition)
	const engineVolMin = toNumberOrNull(filters.engineVolMin)
	const engineVolMax = toNumberOrNull(filters.engineVolMax)
	const ownersCount = toNumberOrNull(filters.ownersCount)
	const city = normalizeText(filters.city)
	const customsCleared = filters.customsCleared === true

	const items = listings.filter((item) => {
	  const haystack = [cleanListingTitle(item.title), item.brand, item.model, item.description]
		.filter(Boolean)
		.map(normalizeText)

	  if (query && !haystack.some((field) => field.includes(query))) return false
	  if (brand && normalizeText(item.brand) !== brand) return false
	  if (model && !normalizeText(item.model).includes(model)) return false

	  if (priceMin !== null && (item.price ?? Number.NEGATIVE_INFINITY) < priceMin) return false
	  if (priceMax !== null && (item.price ?? Number.POSITIVE_INFINITY) > priceMax) return false
	  if (yearMin !== null && (item.year ?? Number.NEGATIVE_INFINITY) < yearMin) return false
	  if (yearMax !== null && (item.year ?? Number.POSITIVE_INFINITY) > yearMax) return false
	  if (mileageMin !== null && (item.mileage ?? Number.NEGATIVE_INFINITY) < mileageMin) return false
	  if (mileageMax !== null && (item.mileage ?? Number.POSITIVE_INFINITY) > mileageMax) return false

	  if (fuelType && normalizeText(item.fuelType) !== fuelType) return false
	  if (transmission && normalizeText(item.transmission) !== transmission) return false
	  if (bodyType && normalizeText(item.bodyType) !== bodyType) return false
	  if (color && normalizeText(item.color) !== color) return false
	  if (driveType && normalizeText(item.driveType) !== driveType) return false
	  if (condition && normalizeText(item.condition) !== condition) return false

	  if (engineVolMin !== null && (item.engineVolume ?? Number.NEGATIVE_INFINITY) < engineVolMin) return false
	  if (engineVolMax !== null && (item.engineVolume ?? Number.POSITIVE_INFINITY) > engineVolMax) return false

	  if (ownersCount !== null && (item.ownersCount ?? Number.POSITIVE_INFINITY) > ownersCount) return false

	  if (city && !normalizeText(item.city || '').includes(city)) return false

	  if (customsCleared && item.customsCleared !== true) return false

	  return true
	})

	return sortListings(items, filters.sort)
  }, [filters, listings])

   const stats = useMemo(() => {
	const usersCount = publicStats?.totalUsers ?? (listings.length > 0 ? Math.ceil(listings.length / 20) + 2 : 0)

	return [
	{ label: t.statsUsers, value: usersCount },
	{ label: t.statsListings, value: listings.length },
	]
   }, [listings, publicStats, t])

  const recommendedListings = useMemo(() => pickDiverseListings(listings, 12), [listings])

  const sampleListings = useMemo(() => {
	const used = new Set(recommendedListings.map((item) => item.id))
	const pool = listings.filter((item) => !used.has(item.id))
	return pickDiverseListings(pool, 9)
  }, [listings, recommendedListings])

  const activeFiltersCount = useMemo(() => {
	return Object.entries(filters).reduce((count, [key, value]) => {
	  if (key === 'sort') return count
	  return count + (String(value).trim() ? 1 : 0)
	}, 0)
  }, [filters])

  const activeFilterChips = useMemo(() => {
	const chips = []

	if (filters.query) chips.push(`Пошук: ${filters.query}`)
	if (filters.brand) chips.push(`Марка: ${filters.brand}`)
	if (filters.model) chips.push(`Модель: ${filters.model}`)
	if (filters.priceMin || filters.priceMax) {
	  chips.push(`Ціна: ${filters.priceMin || '—'} – ${filters.priceMax || '—'}`)
	}
	if (filters.yearMin || filters.yearMax) {
	  chips.push(`Рік: ${filters.yearMin || '—'} – ${filters.yearMax || '—'}`)
	}
	if (filters.mileageMin || filters.mileageMax) {
	  chips.push(`Пробіг: ${filters.mileageMin || '—'} – ${filters.mileageMax || '—'} км`)
	}

	if (filters.fuelType) chips.push(`Паливо: ${filters.fuelType}`)
	if (filters.transmission) chips.push(`Трансмісія: ${filters.transmission}`)
	if (filters.bodyType) chips.push(`Кузов: ${filters.bodyType}`)
	if (filters.color) chips.push(`Колір: ${filters.color}`)
	if (filters.driveType) chips.push(`Привід: ${filters.driveType}`)
	if (filters.condition) chips.push(`Стан: ${filters.condition}`)

	if (filters.engineVolMin || filters.engineVolMax) {
	  chips.push(`Об'єм: ${filters.engineVolMin || '—'} – ${filters.engineVolMax || '—'} л`)
	}

	if (filters.ownersCount) chips.push(`Власників ≤ ${filters.ownersCount}`)
	if (filters.city) chips.push(`Місто: ${filters.city}`)
	if (filters.customsCleared) chips.push(`Розмитнений`)

	return chips
  }, [filters])

  function updateFilter(key, value) {
	setFilters((current) => ({ ...current, [key]: value }))
  }

  function resetFilters() {
	setFilters(INITIAL_FILTERS)
  }

  function handleSearchSubmit(event) {
	event.preventDefault()
	navigate(`/listings?query=${encodeURIComponent(filters.query || '')}`)
  }

   return (
 	<div className={`space-y-10 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
 	  <section className={`relative overflow-hidden rounded-3xl px-6 py-16 sm:px-10 sm:py-20 text-white shadow-2xl ${isDark ? 'bg-gradient-to-br from-sky-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-sky-700 via-blue-600 to-sky-900'}`}>
 		<div className="absolute inset-0 opacity-10">
 		  <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-white blur-3xl transform translate-x-12 -translate-y-12" />
 		  <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-sky-300 blur-3xl transform -translate-x-12 translate-y-12" />
 		</div>
 		<div className="relative max-w-3xl">
 		  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-200">{t.heroEyebrow}</p>
 		  <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
 			{t.heroTitle}
 		  </h1>
 		  <p className="mt-6 max-w-2xl text-base sm:text-lg leading-8 text-sky-100">
 			{t.heroDesc}
 		  </p>
 		</div>
 	  </section>

   	  <section className="px-4 sm:px-0 grid gap-4 sm:grid-cols-2">
 		{stats.slice(0, 2).map((stat) => (
 		  <div key={stat.label} className={`rounded-2xl border ${isDark ? 'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700' : 'border-slate-100 bg-gradient-to-br from-slate-50 to-white'} p-6 shadow-lg hover:shadow-xl transition duration-300`}>
 			<p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
 			<p className={`mt-3 text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
 		  </div>
 		))}
 	  </section>

   	  <section className="py-2 sm:py-4">
 		<div className="max-w-3xl mx-auto text-center">
 		  <form onSubmit={handleSearchSubmit} className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
 			<input
 			  value={filters.query}
 			  onChange={(e) => updateFilter('query', e.target.value)}
 			  placeholder={t.searchPlaceholder}
 			  className={`w-full max-w-2xl rounded-full px-6 py-4 sm:py-4 text-base sm:text-lg outline-none transition border shadow-lg ${isDark ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'border-slate-300 text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'}`}
 			/>
 			<button type="submit" className="rounded-full bg-gradient-to-r from-sky-600 to-sky-700 px-8 py-4 font-semibold text-white shadow-lg hover:shadow-xl transition hover:scale-105 whitespace-nowrap">
 			  {t.searchButton}
 			</button>
 		  </form>

 		</div>
 	  </section>

   	  <section className="space-y-6">
 		{}
 		<div>
 		  <h2 className={`mb-6 text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.recommended}</h2>
			  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{recommendedListings.map(item => (
 			  <ListingCard key={`recommended-${item.id}`} item={item} isDark={isDark} t={t} />
 			))}
 		  </div>
 		</div>

 		{}
 		<div>
 		  <h2 className={`mb-6 text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.verifiedDealers}</h2>
 		  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
 			{['Автоцентр Київ Моторс', 'Львів Авто Плаза', 'Dnipro Auto Hall'].map((dealer) => (
 			  <div key={`dealer-${dealer}`} className={`rounded-3xl border ${isDark ? 'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700' : 'border-slate-100 bg-gradient-to-br from-slate-50 to-white'} p-6 text-center shadow-lg hover:shadow-xl transition`}>
 				<div className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{t.dealerType}</div>
 				<div className={`mt-2 text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{dealer}</div>
 				<div className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.dealerRating}: <span className="text-amber-500">★★★★☆</span></div>
 			  </div>
 			))}
 		  </div>
 		</div>

 		{}
 		<div>
 		  <h2 className={`mb-6 text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.listings}</h2>
			  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{sampleListings.map(item => (
 			  <ListingCard key={`sample-${item.id}`} item={item} isDark={isDark} t={t} />
 			))}
 		  </div>
 		</div>
 	  </section>



   	  <section className={`mt-16 sm:mt-20 rounded-3xl px-6 py-12 sm:py-16 text-white ${isDark ? 'bg-gradient-to-r from-sky-900 to-blue-900' : 'bg-gradient-to-r from-sky-600 to-blue-700'}`}>
 		<div className="max-w-4xl">
 		  <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
 			<div>
 			  <h3 className="text-2xl sm:text-3xl font-bold">{t.sellTitle}</h3>
 			  <p className="mt-2 text-base sm:text-lg text-sky-100">{t.sellDesc}</p>
 			</div>
 			<Link to="/create" className="rounded-full bg-white px-8 py-3 sm:py-4 font-semibold text-slate-900 hover:bg-slate-100 shadow-lg hover:shadow-xl transition whitespace-nowrap text-base">{t.sellButton}</Link>
 		  </div>
 		</div>
 	  </section>

 	  <footer className={`mt-16 sm:mt-20 border-t py-12 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
 		<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 		  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
 			<div>
 			  <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>DrivePoint</h4>
 			  <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Найкращий маркетплейс для купівлі та продажу транспорту</p>
 			</div>
 			<div>
 			  <h4 className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{language === 'uk' ? 'Навігація' : 'Navigation'}</h4>
 			  <ul className={`mt-4 space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
 				<li><Link to="/listings" className="hover:text-sky-600 transition">{language === 'uk' ? 'Каталог' : 'Catalog'}</Link></li>
 				<li><Link to="/ai-assistant" className="hover:text-sky-600 transition">{language === 'uk' ? 'ШІ Помічник' : 'AI Assistant'}</Link></li>
 				<li><Link to="/about" className="hover:text-sky-600 transition">{language === 'uk' ? 'Про нас' : 'About'}</Link></li>
 			  </ul>
 			</div>
 			<div>
 			  <h4 className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{language === 'uk' ? 'Допомога' : 'Help'}</h4>
 			  <ul className={`mt-4 space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
 				<li><Link to="/contacts" className="hover:text-sky-600 transition">{language === 'uk' ? 'Контакти' : 'Contacts'}</Link></li>
 				<li><Link to="/terms" className="hover:text-sky-600 transition">{language === 'uk' ? 'Умови' : 'Terms'}</Link></li>
 			  </ul>
 			</div>
 		  </div>
 		  <div className={`border-t ${isDark ? 'border-slate-700' : 'border-slate-200'} pt-8 flex flex-col items-center justify-between gap-4 sm:flex-row`}>
 			<div className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>© {new Date().getFullYear()} {t.footerText}. {language === 'uk' ? 'Усі права захищені.' : 'All rights reserved.'}</div>
 		  </div>
 		</div>
 	  </footer>
 	</div>
  )
}






