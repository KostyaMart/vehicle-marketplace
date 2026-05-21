import React, { useEffect, useMemo, useState, useContext } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getListing } from '../api/listings'
import { getFavorites, toggleFavoriteItem } from '../api/auth'
import { ThemeContext } from '../context/ThemeContext'

function formatMoney(value) {
  if (typeof value !== 'number') return '—'
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value))}`
}

function formatMileage(value) {
  if (typeof value !== 'number') return '—'
  return `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(Math.round(value))} км`
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
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError('')
      const data = await getListing(id)
      if (!mounted) return

      if (data?.error) {
        setError(data.error)
        setListing(null)
      } else {
        setListing(data)
        setActiveIndex(0)
      }
      setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [id])

  const photos = useMemo(() => {
    if (!listing) return []
    return Array.isArray(listing.photoUrls) ? listing.photoUrls.filter(Boolean) : []
  }, [listing])

  const activePhoto = photos[activeIndex] || ''

  useEffect(() => {
    if (!listing?.id) return
    const favorites = getFavorites()
    setIsFavorite(favorites.some((fav) => fav.id === listing.id))
  }, [listing])

  function toggleFavorite() {
    if (!listing) return
    const nextState = toggleFavoriteItem(listing)
    setIsFavorite(nextState)
  }

  function goPrev() {
    if (!photos.length) return
    setActiveIndex((current) => (current - 1 + photos.length) % photos.length)
  }

  function goNext() {
    if (!photos.length) return
    setActiveIndex((current) => (current + 1) % photos.length)
  }

  if (loading) {
    return <div className={`rounded-2xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>Завантаження оголошення…</div>
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
  }

  if (!listing) {
    return <div className={`rounded-2xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>Оголошення не знайдено.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link to="/listings" className={`rounded-full border px-4 py-2 text-sm font-medium transition ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
          ← Повернутися до каталогу
        </Link>
        <div className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ID: {listing.id}</div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <div className={`rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4 shadow-sm`}>
          <div className={`relative overflow-hidden rounded-3xl ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
            {activePhoto ? (
              <img src={activePhoto} alt={listing.title} className="h-64 sm:h-[420px] w-full object-cover" />
            ) : (
              <div className={`flex h-64 sm:h-[420px] items-center justify-center text-sm ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>Фото відсутнє</div>
            )}

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 rounded-full px-3 sm:px-4 py-2 text-sm font-semibold shadow transition ${isDark ? 'bg-slate-700/90 text-white hover:bg-slate-600' : 'bg-white/90 text-slate-900 hover:bg-white'}`}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 rounded-full px-3 sm:px-4 py-2 text-sm font-semibold shadow transition ${isDark ? 'bg-slate-700/90 text-white hover:bg-slate-600' : 'bg-white/90 text-slate-900 hover:bg-white'}`}
                >
                  ›
                </button>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-6">
              {photos.map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={[
                    'overflow-hidden rounded-2xl border-2 transition',
                    index === activeIndex ? 'border-sky-500' : isDark ? 'border-transparent opacity-60 hover:opacity-100' : 'border-transparent opacity-80 hover:opacity-100',
                  ].join(' ')}
                >
                  <img src={photo} alt={`${listing.title} ${index + 1}`} className="h-16 sm:h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className={`space-y-4 rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-6 shadow-sm`}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Деталі оголошення</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{listing.title}</h1>
              <button
                type="button"
                onClick={toggleFavorite}
                className={`rounded-full p-2 transition ${isFavorite ? 'bg-red-500 text-white' : isDark ? 'bg-slate-700 text-slate-300 hover:bg-red-500 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white'}`}
                aria-label="Toggle favorite"
              >
                {isFavorite ? '❤️' : '🤍'}
              </button>
            </div>
            <p className={`mt-2 text-xs sm:text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{listing.description}</p>
          </div>

          <div className={`rounded-3xl p-5 text-white ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}>
            <div className={isDark ? 'text-slate-300 text-sm' : 'text-slate-300 text-sm'}>Ціна</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold">{formatMoney(listing.price)}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="Марка" value={listing.brand} isDark={isDark} />
            <DetailRow label="Модель" value={listing.model} isDark={isDark} />
            <DetailRow label="Рік" value={listing.year} isDark={isDark} />
            <DetailRow label="Пробіг" value={formatMileage(listing.mileage)} isDark={isDark} />
            <DetailRow label="Місто" value={listing.city} isDark={isDark} />
            <DetailRow label="Стан" value={listing.condition} isDark={isDark} />
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <DetailRow label="Тип палива" value={listing.fuelType} isDark={isDark} />
        <DetailRow label="Трансмісія" value={listing.transmission} isDark={isDark} />
        <DetailRow label="Тип кузова" value={listing.bodyType} isDark={isDark} />
        <DetailRow label="Колір" value={listing.color} isDark={isDark} />
        <DetailRow label="Привід" value={listing.driveType} isDark={isDark} />
        <DetailRow label="Об'єм двигуна" value={listing.engineVolume ? `${listing.engineVolume} л` : '—'} isDark={isDark} />
        <DetailRow label="Власників" value={listing.ownersCount} isDark={isDark} />
        <DetailRow label="Розмитнений" value={listing.customsCleared ? 'Так' : 'Ні'} isDark={isDark} />
        <DetailRow label="Додано" value={listing.createdAt ? new Date(listing.createdAt).toLocaleString('uk-UA') : '—'} isDark={isDark} />
      </section>
    </div>
  )
}

