import React, { useEffect, useMemo, useState, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getListings } from '../api/listings'
import { ThemeContext } from '../context/ThemeContext'
import { LanguageContext } from '../context/LanguageContext'
import { getFavorites, toggleFavoriteItem } from '../api/auth'
import { toCanonicalValue, translateDescription, translateValue } from '../utils/translations'
import { cleanListingTitle } from '../utils/listingTitle'

const INITIAL_FILTERS = {
  vehicleType: 'car',
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

const translations = {
  uk: {
    catalogTitle: 'Каталог оголошень',
    catalogSubtitle: 'Оголошення та фільтри',
    catalogDesc: 'Шукайте транспорт, а фільтри зліва допоможуть швидко звузити вибір.',
    found: 'Знайдено',
    from: 'з',
    listings: 'оголошень',
    filters: 'Фільтри',
    filterDesc: 'Сортування, марка, рік, пробіг та інші параметри.',
    cars: 'Авто',
    motos: 'Мото',
    brand: 'Марка',
    model: 'Модель',
    priceFrom: 'Ціна від',
    priceTo: 'Ціна до',
    yearFrom: 'Рік від',
    yearTo: 'Рік до',
    mileageFrom: 'Пробіг від',
    mileageTo: 'Пробіг до',
    fuelType: 'Тип палива',
    transmission: 'Трансмісія',
    bodyType: 'Тип кузова',
    color: 'Колір',
    driveType: 'Привід',
    condition: 'Стан',
    engineVol: 'Об\'єм двигуна',
    owners: 'Кількість власників',
    city: 'Місто',
    customs: 'Розмитнений',
    sorting: 'Сортування',
    reset: 'Скинути',
    activeFilters: 'Активні фільтри',
    noResults: 'Жодне оголошення не відповідає вибраним фільтрам.',
    loading: 'Завантаження оголошень…',
    allBrands: 'Усі марки',
    allModels: 'Усі моделі',
    anyFuel: 'Будь-який',
    anyTransmission: 'Будь-яка',
    anyBodyType: 'Будь-який',
    anyColor: 'Будь-який',
    anyDrive: 'Будь-який',
    anyCondition: 'Будь-який',
    anyOwners: 'Будь-яка',
  },
  en: {
    catalogTitle: 'Listings Catalog',
    catalogSubtitle: 'Listings and Filters',
    catalogDesc: 'Search for transport, and the filters on the left will help you narrow down quickly.',
    found: 'Found',
    from: 'of',
    listings: 'listings',
    filters: 'Filters',
    filterDesc: 'Sorting, brand, year, mileage and other parameters.',
    cars: 'Cars',
    motos: 'Motos',
    brand: 'Brand',
    model: 'Model',
    priceFrom: 'Price from',
    priceTo: 'Price to',
    yearFrom: 'Year from',
    yearTo: 'Year to',
    mileageFrom: 'Mileage from',
    mileageTo: 'Mileage to',
    fuelType: 'Fuel Type',
    transmission: 'Transmission',
    bodyType: 'Body Type',
    color: 'Color',
    driveType: 'Drive Type',
    condition: 'Condition',
    engineVol: 'Engine Volume',
    owners: 'Number of Owners',
    city: 'City',
    customs: 'Customs Cleared',
    sorting: 'Sorting',
    reset: 'Reset',
    activeFilters: 'Active Filters',
    noResults: 'No listings match your selected filters.',
    loading: 'Loading listings...',
    allBrands: 'All brands',
    allModels: 'All models',
    anyFuel: 'Any',
    anyTransmission: 'Any',
    anyBodyType: 'Any',
    anyColor: 'Any',
    anyDrive: 'Any',
    anyCondition: 'Any',
    anyOwners: 'Any',
  }
}

const SORT_OPTIONS = {
  uk: [
    { value: 'relevance', label: 'За релевантністю' },
    { value: 'price-asc', label: 'Спочатку дешевші' },
    { value: 'price-desc', label: 'Спочатку дорожчі' },
    { value: 'year-desc', label: 'Спочатку новіші' },
    { value: 'mileage-asc', label: 'Спочатку з меншим пробігом' },
  ],
  en: [
    { value: 'relevance', label: 'By relevance' },
    { value: 'price-asc', label: 'Cheapest first' },
    { value: 'price-desc', label: 'Most expensive first' },
    { value: 'year-desc', label: 'Newest first' },
    { value: 'mileage-asc', label: 'Lowest mileage first' },
  ]
}

const CAR_BODY_TYPES = ['Седан', 'Універсал', 'Хетчбек', 'Кросовер', 'Позашляховик', 'Мікровен', 'Купе', 'Кабріолет']
const MOTO_BODY_TYPES = ['Спортбайк', 'Туристичний', 'Круізер', 'Ендуро', 'Кросовий', 'Мопед/Скутер', 'Нейкед']

const CITY_UK_TO_EN = {
  'Київ': 'Kyiv',
  'Львів': 'Lviv',
  'Одеса': 'Odesa',
  'Дніпро': 'Dnipro',
  'Харків': 'Kharkiv',
  'Запоріжжя': 'Zaporizhzhia',
  'Вінниця': 'Vinnytsia',
  'Полтава': 'Poltava',
  'Черкаси': 'Cherkasy',
  'Івано-Франківськ': 'Ivano-Frankivsk',
  'Тернопіль': 'Ternopil',
  'Рівне': 'Rivne',
}

const CITY_EN_TO_UK = Object.fromEntries(Object.entries(CITY_UK_TO_EN).map(([uk, en]) => [en, uk]))

function toCanonicalCity(city) {
  if (!city) return city
  const normalized = String(city).trim()
  return CITY_EN_TO_UK[normalized] || normalized
}

function translateCity(city, language) {
  const canonical = toCanonicalCity(city)
  if (!canonical) return canonical
  if (language === 'uk') return canonical
  return CITY_UK_TO_EN[canonical] || canonical
}

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

function formatMileage(value, language) {
  if (typeof value !== 'number') return '—'
  const locale = language === 'uk' ? 'uk-UA' : 'en-US'
  const suffix = language === 'uk' ? 'км' : 'km'
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(value))} ${suffix}`
}

function modelGroupKey(item) {
  return `${String(item?.brand || '').toLowerCase()}|${String(item?.model || '').toLowerCase()}`
}

function distributeByModel(items) {
  if (!Array.isArray(items) || items.length <= 2) return items

  const groups = new Map()
  for (const item of items) {
    const key = modelGroupKey(item)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }

  const keys = [...groups.keys()].sort((a, b) => {
    // Larger groups first so they get spread earlier.
    return (groups.get(b)?.length || 0) - (groups.get(a)?.length || 0)
  })

  const result = []
  let shift = 0
  while (result.length < items.length) {
    let progressed = false
    for (let i = 0; i < keys.length; i += 1) {
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
      return distributeByModel(list)
  }
}

function ListingCard({ item, isDark, language }) {
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
        aria-label="Add to favorites"
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>

      <div className="mb-4 overflow-hidden rounded-2xl bg-slate-100">
        {cover ? (
          <img src={cover} alt={displayTitle} className="h-40 sm:h-52 w-full object-cover" />
        ) : (
          <div className={`flex h-40 sm:h-52 items-center justify-center text-sm ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{language === 'uk' ? 'Фото відсутнє' : 'No photo'}</div>
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

      <p className={`mt-3 line-clamp-3 text-xs sm:text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{translateDescription(item.description, language)}</p>

      <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
        <div className={`rounded-xl p-2 sm:p-3 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
          <dt className={isDark ? 'text-slate-400' : 'text-slate-500'}>{language === 'uk' ? 'Рік' : 'Year'}</dt>
          <dd className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.year ?? '—'}</dd>
        </div>
        <div className={`rounded-xl p-2 sm:p-3 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
          <dt className={isDark ? 'text-slate-400' : 'text-slate-500'}>{language === 'uk' ? 'Пробіг' : 'Mileage'}</dt>
          <dd className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatMileage(item.mileage, language)}</dd>
        </div>
        <div className={`rounded-xl p-2 sm:p-3 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
          <dt className={isDark ? 'text-slate-400' : 'text-slate-500'}>{language === 'uk' ? 'Марка' : 'Brand'}</dt>
          <dd className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.brand}</dd>
        </div>
      </dl>
    </Link>
  )
}

function FilterField({ label, children, isDark }) {
  return (
    <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

export default function ListingsPage() {
  const { isDark } = useContext(ThemeContext)
  const { language } = useContext(LanguageContext)
  const location = useLocation()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const t = translations[language] || translations['uk']
  const sortOptions = SORT_OPTIONS[language] || SORT_OPTIONS['uk']

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('query') || ''
    setFilters((current) => ({ ...current, query }))
  }, [location.search])

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError('')
      const data = await getListings()
      if (!mounted) return

      if (data?.error) {
        setError(data.error)
        setListings([])
      } else {
        setListings(Array.isArray(data) ? data : [])
      }

      setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const brandOptions = useMemo(() => {
    const selectedType = normalizeText(filters.vehicleType)
    const source = selectedType ? listings.filter((item) => normalizeText(item.vehicleType) === selectedType) : listings
    return [...new Set(source.map((item) => item.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'uk'))
  }, [filters.vehicleType, listings])

  const modelOptions = useMemo(() => {
    const selectedType = normalizeText(filters.vehicleType)
    const typedListings = selectedType ? listings.filter((item) => normalizeText(item.vehicleType) === selectedType) : listings
    const source = filters.brand ? typedListings.filter((item) => item.brand === filters.brand) : typedListings
    return [...new Set(source.map((item) => item.model).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'uk'))
  }, [filters.brand, filters.vehicleType, listings])

  const fuelOptions = useMemo(() => {
    if (filters.vehicleType === 'motorcycle') return ['Бензин', 'Електро']
    const db = [...new Set(listings.map((i) => toCanonicalValue(i.fuelType)).filter(Boolean))]
    return [...new Set([...db, 'Бензин', 'Дизель', 'Газ (LPG)', 'Газ (CNG)', 'Гібрид', 'Електро'])].sort((a, b) => String(a).localeCompare(String(b), 'uk'))
  }, [filters.vehicleType, listings])
  const transmissionOptions = useMemo(() => {
    if (filters.vehicleType === 'motorcycle') return ['Варіатор', 'Механіка', 'Автомат']
    const db = [...new Set(listings.map((i) => toCanonicalValue(i.transmission)).filter(Boolean))]
    return [...new Set([...db, 'Механіка', 'Автомат', 'Варіатор', 'Робот'])].sort((a, b) => String(a).localeCompare(String(b), 'uk'))
  }, [filters.vehicleType, listings])
  const bodyOptions = useMemo(() => {
    const allowed = filters.vehicleType === 'motorcycle' ? MOTO_BODY_TYPES : CAR_BODY_TYPES
    const db = [...new Set(listings.map((i) => toCanonicalValue(i.bodyType)).filter((v) => allowed.includes(v)))]
    return [...new Set([...db, ...allowed])].sort((a, b) => String(a).localeCompare(String(b), 'uk'))
  }, [filters.vehicleType, listings])
  const colorOptions = useMemo(() => {
    const db = [...new Set(listings.map((i) => toCanonicalValue(i.color)).filter(Boolean))]
    return [...new Set([...db, 'Чорний','Білий','Сірий','Сріблистий','Червоний','Синій','Зелений','Жовтий','Коричневий','Помаранчевий','Золотий','Бежевий','Бордовий'])].sort((a,b) => String(a).localeCompare(String(b),'uk'))
  }, [listings])
  const driveOptions = useMemo(() => {
    if (filters.vehicleType === 'motorcycle') return []
    return ['Передній', 'Задній', 'Повний']
  }, [filters.vehicleType])
  const conditionOptions = useMemo(() => {
    const db = [...new Set(listings.map((i) => toCanonicalValue(i.condition)).filter(Boolean))]
    return [...new Set([...db, 'Требує ремонту','Задовільний','Хороший','Відмінний'])].sort((a,b) => String(a).localeCompare(String(b),'uk'))
  }, [listings])
  const cityOptions = useMemo(() => {
    const db = [...new Set(listings.map((i) => toCanonicalCity(i.city)).filter(Boolean))]
    const common = ['Київ', 'Львів', 'Одеса', 'Дніпро', 'Харків', 'Запоріжжя', 'Вінниця', 'Полтава', 'Черкаси', 'Івано-Франківськ', 'Тернопіль', 'Рівне']
    return [...new Set([...db, ...common])].sort((a, b) => String(a).localeCompare(String(b), 'uk'))
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
      const haystack = [cleanListingTitle(item.title), item.brand, item.model, item.description].filter(Boolean).map(normalizeText)

      // vehicleType toggle
      const vehicleTypeValue = normalizeText(filters.vehicleType)
      if (vehicleTypeValue === 'car') {
        const vt = normalizeText(item.vehicleType)
        if (vt && vt !== 'car') return false
      } else if (vehicleTypeValue === 'motorcycle') {
        const vt = normalizeText(item.vehicleType)
        if (vt !== 'motorcycle') return false
      }

      if (query && !haystack.some((field) => field.includes(query))) return false
      if (brand && normalizeText(item.brand) !== brand) return false
      if (model && !normalizeText(item.model).includes(model)) return false

      if (priceMin !== null && (item.price ?? Number.NEGATIVE_INFINITY) < priceMin) return false
      if (priceMax !== null && (item.price ?? Number.POSITIVE_INFINITY) > priceMax) return false
      if (yearMin !== null && (item.year ?? Number.NEGATIVE_INFINITY) < yearMin) return false
      if (yearMax !== null && (item.year ?? Number.POSITIVE_INFINITY) > yearMax) return false
      if (mileageMin !== null && (item.mileage ?? Number.NEGATIVE_INFINITY) < mileageMin) return false
      if (mileageMax !== null && (item.mileage ?? Number.POSITIVE_INFINITY) > mileageMax) return false

      if (fuelType && normalizeText(toCanonicalValue(item.fuelType)) !== normalizeText(toCanonicalValue(fuelType))) return false
      if (transmission && normalizeText(toCanonicalValue(item.transmission)) !== normalizeText(toCanonicalValue(transmission))) return false
      const bodyTypeMatches = !bodyType || normalizeText(toCanonicalValue(item.bodyType)) === normalizeText(toCanonicalValue(bodyType))
      if (!bodyTypeMatches) return false
      if (color && normalizeText(toCanonicalValue(item.color)) !== normalizeText(toCanonicalValue(color))) return false
      if (filters.vehicleType !== 'motorcycle' && driveType && normalizeText(toCanonicalValue(item.driveType)) !== normalizeText(toCanonicalValue(driveType))) return false
      if (condition && normalizeText(toCanonicalValue(item.condition)) !== normalizeText(toCanonicalValue(condition))) return false

      if (engineVolMin !== null && (item.engineVolume ?? Number.NEGATIVE_INFINITY) < engineVolMin) return false
      if (engineVolMax !== null && (item.engineVolume ?? Number.POSITIVE_INFINITY) > engineVolMax) return false
      if (ownersCount !== null && (item.ownersCount ?? Number.POSITIVE_INFINITY) > ownersCount) return false
      if (city && !normalizeText(toCanonicalCity(item.city) || '').includes(normalizeText(toCanonicalCity(city)))) return false
      if (customsCleared && item.customsCleared !== true) return false

      return true
    })

    return sortListings(items, filters.sort)
  }, [filters, listings])

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'sort') return count
      return count + (String(value).trim() ? 1 : 0)
    }, 0)
  }, [filters])

  const activeFilterChips = useMemo(() => {
    const chips = []
    const tv = (v) => translateValue(v, language)
    const lSearch  = language === 'uk' ? 'Пошук'       : 'Search'
    const lBrand   = t.brand
    const lModel   = t.model
    const lPrice   = t.priceFrom.replace(' від','').replace(' from','')
    const lYear    = t.yearFrom.replace(' від','').replace(' from','')
    const lMileage = t.mileageFrom.replace(' від','').replace(' from','')
    const lFuel    = t.fuelType
    const lTrans   = t.transmission
    const lBody    = t.bodyType
    const lColor   = t.color
    const lDrive   = t.driveType
    const lCond    = t.condition
    const lVol     = language === 'uk' ? "Об'єм" : 'Volume'
    const lOwners  = language === 'uk' ? 'Власників ≤' : 'Owners ≤'
    const lCity    = t.city
    const lCustoms = t.customs
    const lKm      = language === 'uk' ? 'км' : 'km'
    const lL       = 'l'

    if (filters.query) chips.push(`${lSearch}: ${filters.query}`)
    if (filters.brand) chips.push(`${lBrand}: ${filters.brand}`)
    if (filters.model) chips.push(`${lModel}: ${filters.model}`)
    if (filters.priceMin || filters.priceMax) chips.push(`${lPrice}: ${filters.priceMin || '—'} – ${filters.priceMax || '—'}`)
    if (filters.yearMin || filters.yearMax) chips.push(`${lYear}: ${filters.yearMin || '—'} – ${filters.yearMax || '—'}`)
    if (filters.mileageMin || filters.mileageMax) chips.push(`${lMileage}: ${filters.mileageMin || '—'} – ${filters.mileageMax || '—'} ${lKm}`)
    if (filters.fuelType) chips.push(`${lFuel}: ${tv(filters.fuelType)}`)
    if (filters.transmission) chips.push(`${lTrans}: ${tv(filters.transmission)}`)
    if (filters.bodyType) chips.push(`${lBody}: ${tv(filters.bodyType)}`)
    if (filters.color) chips.push(`${lColor}: ${tv(filters.color)}`)
    if (filters.vehicleType !== 'motorcycle' && filters.driveType) chips.push(`${lDrive}: ${tv(filters.driveType)}`)
    if (filters.condition) chips.push(`${lCond}: ${tv(filters.condition)}`)
    if (filters.engineVolMin || filters.engineVolMax) chips.push(`${lVol}: ${filters.engineVolMin || '—'} – ${filters.engineVolMax || '—'} ${lL}`)
    if (filters.ownersCount) chips.push(`${lOwners} ${filters.ownersCount}`)
    if (filters.city) chips.push(`${lCity}: ${translateCity(filters.city, language)}`)
    if (filters.customsCleared) chips.push(lCustoms)

    return chips
  }, [filters, language, t])

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function resetFilters() {
    setFilters(INITIAL_FILTERS)
  }

  return (
    <div className="space-y-8">
      <section className={`rounded-3xl p-6 shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">{t.catalogTitle}</p>
            <h1 className={`mt-2 text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.catalogSubtitle}</h1>
            <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.catalogDesc}</p>
          </div>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.found} {filtered.length} {t.from} {listings.length} {t.listings}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className={`h-fit rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4 sm:p-6 shadow-sm lg:sticky lg:top-24 overflow-y-auto max-h-[70vh] lg:max-h-[calc(100vh-8rem)]`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.filters}</h2>
              <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.filterDesc}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs sm:text-sm font-semibold whitespace-nowrap ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>{activeFiltersCount}</span>
          </div>

          <div className="mt-6 grid gap-4">
            {/* Vehicle type toggle */}
            <div className={`relative flex rounded-2xl p-1 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              {/* скользящий фон */}
              <span
                className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-sky-500 shadow-md transition-transform duration-300 ease-in-out"
                style={{
                  transform: filters.vehicleType === 'motorcycle'
                    ? 'translateX(calc(100% + 8px))'
                    : 'translateX(0)',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  updateFilter('vehicleType', 'car')
                  updateFilter('brand', '')
                  updateFilter('model', '')
                  updateFilter('bodyType', '')
                }}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors duration-200 ${
                  filters.vehicleType === 'car'
                    ? 'text-white'
                    : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="text-base">🚗</span>
                {t.cars}
              </button>
              <button
                type="button"
                onClick={() => {
                  updateFilter('vehicleType', 'motorcycle')
                  updateFilter('brand', '')
                  updateFilter('model', '')
                  updateFilter('driveType', '')
                  updateFilter('bodyType', '')
                }}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors duration-200 ${
                  filters.vehicleType === 'motorcycle'
                    ? 'text-white'
                    : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="text-base">🏍️</span>
                {t.motos}
              </button>
            </div>

            <FilterField label={t.brand} isDark={isDark}>
              <select
                value={filters.brand}
                onChange={(e) => {
                  updateFilter('brand', e.target.value)
                  updateFilter('model', '')
                }}
                className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}
              >
                <option value="">{t.allBrands}</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </FilterField>

            <FilterField label={t.model} isDark={isDark}>
              <>
                <input
                  list="model-options"
                  value={filters.model}
                  onChange={(e) => updateFilter('model', e.target.value)}
                  placeholder="Civic, Model 3, Golf…"
                  className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}
                />
                <datalist id="model-options">
                  {modelOptions.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              </>
            </FilterField>

            <div className="grid gap-3 sm:grid-cols-2">
              <FilterField label={t.priceFrom} isDark={isDark}>
                <input type="number" min="0" value={filters.priceMin} onChange={(e) => updateFilter('priceMin', e.target.value)} placeholder="5000" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
              </FilterField>
              <FilterField label={t.priceTo} isDark={isDark}>
                <input type="number" min="0" value={filters.priceMax} onChange={(e) => updateFilter('priceMax', e.target.value)} placeholder="20000" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
              </FilterField>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FilterField label={t.yearFrom} isDark={isDark}>
                <input type="number" min="1900" value={filters.yearMin} onChange={(e) => updateFilter('yearMin', e.target.value)} placeholder="2015" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
              </FilterField>
              <FilterField label={t.yearTo} isDark={isDark}>
                <input type="number" min="1900" value={filters.yearMax} onChange={(e) => updateFilter('yearMax', e.target.value)} placeholder="2022" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
              </FilterField>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FilterField label={t.mileageFrom} isDark={isDark}>
                <input type="number" min="0" value={filters.mileageMin} onChange={(e) => updateFilter('mileageMin', e.target.value)} placeholder="0" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
              </FilterField>
              <FilterField label={t.mileageTo} isDark={isDark}>
                <input type="number" min="0" value={filters.mileageMax} onChange={(e) => updateFilter('mileageMax', e.target.value)} placeholder="150000" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
              </FilterField>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FilterField label={t.fuelType} isDark={isDark}>
                <select value={filters.fuelType} onChange={(e) => updateFilter('fuelType', e.target.value)} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}>
                  <option value="">{t.anyFuel}</option>
                  {fuelOptions.map((f) => (<option key={f} value={f}>{translateValue(f, language)}</option>))}
                </select>
              </FilterField>
              <FilterField label={t.transmission} isDark={isDark}>
                <select value={filters.transmission} onChange={(e) => updateFilter('transmission', e.target.value)} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}>
                  <option value="">{t.anyTransmission}</option>
                  {transmissionOptions.map((t) => (<option key={t} value={t}>{translateValue(t, language)}</option>))}
                </select>
              </FilterField>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FilterField label={t.bodyType} isDark={isDark}>
                <select value={filters.bodyType} onChange={(e) => updateFilter('bodyType', e.target.value)} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}>
                  <option value="">{t.anyBodyType}</option>
                  {bodyOptions.map((b) => (<option key={b} value={b}>{translateValue(b, language)}</option>))}
                </select>
              </FilterField>
              <FilterField label={t.color} isDark={isDark}>
                <select value={filters.color} onChange={(e) => updateFilter('color', e.target.value)} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}>
                  <option value="">{t.anyColor}</option>
                  {colorOptions.map((c) => (<option key={c} value={c}>{translateValue(c, language)}</option>))}
                </select>
              </FilterField>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {filters.vehicleType !== 'motorcycle' && (
              <FilterField label={t.driveType} isDark={isDark}>
                <select value={filters.driveType} onChange={(e) => updateFilter('driveType', e.target.value)} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}>
                  <option value="">{t.anyDrive}</option>
                  {driveOptions.map((d) => (<option key={d} value={d}>{translateValue(d, language)}</option>))}
                </select>
              </FilterField>
              )}
              <FilterField label={t.condition} isDark={isDark}>
                <select value={filters.condition} onChange={(e) => updateFilter('condition', e.target.value)} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}>
                  <option value="">{t.anyCondition}</option>
                  {conditionOptions.map((c) => (<option key={c} value={c}>{translateValue(c, language)}</option>))}
                </select>
              </FilterField>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FilterField label={t.engineVol + ' ' + t.priceFrom + ' (л)'} isDark={isDark}>
                <input type="number" step="0.1" min="0" value={filters.engineVolMin} onChange={(e) => updateFilter('engineVolMin', e.target.value)} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
              </FilterField>
              <FilterField label={t.engineVol + ' ' + t.priceTo + ' (л)'} isDark={isDark}>
                <input type="number" step="0.1" min="0" value={filters.engineVolMax} onChange={(e) => updateFilter('engineVolMax', e.target.value)} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
              </FilterField>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FilterField label={t.owners + ' (max)'} isDark={isDark}>
                <select value={filters.ownersCount} onChange={(e) => updateFilter('ownersCount', e.target.value)} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}>
                  <option value="">{t.anyOwners}</option>
                  {[0, 1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>{n}</option>))}
                </select>
              </FilterField>
              <FilterField label={t.city} isDark={isDark}>
                <select value={filters.city} onChange={(e) => updateFilter('city', e.target.value)} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}>
                  <option value="">{language === 'uk' ? 'Будь-яке' : 'Any'}</option>
                  {cityOptions.map((city) => (<option key={city} value={city}>{translateCity(city, language)}</option>))}
                </select>
              </FilterField>
            </div>

            <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              <input type="checkbox" checked={!!filters.customsCleared} onChange={(e) => updateFilter('customsCleared', e.target.checked)} />
              <span>{t.customs}</span>
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" onClick={resetFilters} className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${isDark ? 'border border-slate-600 text-slate-200 hover:bg-slate-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                {t.reset}
              </button>
            </div>

            {activeFilterChips.length > 0 && (
              <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.activeFilters}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeFilterChips.map((chip) => (
                    <span key={chip} className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ring-1 ${isDark ? 'bg-slate-600 text-slate-100 ring-slate-600' : 'bg-white text-slate-600 ring-slate-200'}`}>{chip}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="space-y-4">
          <div className={`flex items-center justify-between rounded-2xl p-4 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t.found} {filtered.length} {t.from} {listings.length} {t.listings}</span>
            <div className="w-48">
              <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)} className={`w-full rounded-xl px-4 py-2 outline-none transition text-sm ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          {loading ? (
            <div className={`rounded-2xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>{t.loading}</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
          ) : filtered.length === 0 ? (
            <div className={`rounded-2xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>{t.noResults}</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((item) => (
                <ListingCard key={item.id} item={item} isDark={isDark} language={language} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

