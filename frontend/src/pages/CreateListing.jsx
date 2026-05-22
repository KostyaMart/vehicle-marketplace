import React, { useEffect, useMemo, useState, useContext } from 'react'
import { getListings } from '../api/listings'
import { createListing } from '../api/listings'
import { useNavigate } from 'react-router-dom'
import { getToken, getCurrentUsername } from '../api/auth'
import { ThemeContext } from '../context/ThemeContext'
import { LanguageContext } from '../context/LanguageContext'

export default function CreateListing() {
  const { isDark } = useContext(ThemeContext)
  const { language } = useContext(LanguageContext)
  const translations = {
    uk: {
      headerTitle: 'Створити оголошення',
      authNote: 'POST /api/listings потребує JWT, тож спочатку увійдіть.',
      loginFirst: 'Спочатку увійдіть',
      title: 'Назва',
      titlePlaceholder: 'Honda Accord 2019',
      brand: 'Марка',
      brandPlaceholder: 'Honda',
      model: 'Модель',
      modelPlaceholder: 'Accord',
      price: 'Ціна',
      pricePlaceholder: '7500',
      year: 'Рік',
      yearPlaceholder: '2019',
      mileage: 'Пробіг',
      mileagePlaceholder: '65000',
      description: 'Опис',
      descriptionPlaceholder: 'Добрий стан, регулярно обслуговувався…',
      photosNote: 'Фото до 10 штук',
      selectedPhotos: 'Обрано {count} / 10',
      photoLimitError: 'Можна додати максимум 10 фото',
      creating: 'Створення…',
      create: 'Створити',
      failedCreate: 'Не вдалося створити',
    },
    en: {
      headerTitle: 'Create listing',
      authNote: 'POST /api/listings requires a JWT, please login first.',
      loginFirst: 'Please login first',
      title: 'Title',
      titlePlaceholder: 'Honda Accord 2019',
      brand: 'Brand',
      brandPlaceholder: 'Honda',
      model: 'Model',
      modelPlaceholder: 'Accord',
      price: 'Price',
      pricePlaceholder: '7500',
      year: 'Year',
      yearPlaceholder: '2019',
      mileage: 'Mileage',
      mileagePlaceholder: '65000',
      description: 'Description',
      descriptionPlaceholder: 'Good condition, regularly serviced…',
      photosNote: 'Photos up to 10 items',
      selectedPhotos: 'Selected {count} / 10',
      photoLimitError: 'You can add maximum 10 photos',
      creating: 'Creating…',
      create: 'Create',
      failedCreate: 'Failed to create',
    }
  }
  const t = translations[language] || translations.uk
  const [form, setForm] = useState({ title: '', description: '', price: '', year: '', mileage: '', brand: '', model: '' })
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [catalogListings, setCatalogListings] = useState([])
  const navigate = useNavigate()
  const isAuthenticated = Boolean(getToken())

  const photoPreviews = useMemo(() => photos.map((file) => ({ file, preview: URL.createObjectURL(file) })), [photos])
  const brandOptions = useMemo(() => {
    const dbBrands = catalogListings.map((item) => item.brand).filter(Boolean)
    const extraBrands = ['Audi', 'BMW', 'Chevrolet', 'Ford', 'Honda', 'Hyundai', 'Kia', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Skoda', 'Tesla', 'Toyota', 'Volkswagen', 'Yamaha']
    const locale = language === 'en' ? 'en' : 'uk'
    return [...new Set([...dbBrands, ...extraBrands])].sort((a, b) => String(a).localeCompare(String(b), locale))
  }, [catalogListings])
  const modelOptions = useMemo(() => {
    const dbModels = catalogListings.map((item) => item.model).filter(Boolean)
    const extraModels = ['Accord', 'A4', 'Camry', 'Civic', 'Corolla', 'CX-5', 'Focus', 'Golf', 'Model 3', 'Ninja', 'Octavia', 'RAV4', 'Sprinter', 'X5']
    const locale = language === 'en' ? 'en' : 'uk'
    return [...new Set([...dbModels, ...extraModels])].sort((a, b) => String(a).localeCompare(String(b), locale))
  }, [catalogListings])

  useEffect(() => {
    return () => {
      photoPreviews.forEach((item) => URL.revokeObjectURL(item.preview))
    }
  }, [photoPreviews])

  useEffect(() => {
    let mounted = true
    getListings().then((data) => {
      if (mounted && Array.isArray(data)) {
        setCatalogListings(data)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      price: parseFloat(form.price),
      year: parseInt(form.year || 0),
      mileage: parseInt(form.mileage || 0),
      photos,
    }
    const res = await createListing(payload)
    if (res && res.id) {
      const username = getCurrentUsername() || ''
      if (username) {
        const key = `myListingIds:${username}`
        const ids = JSON.parse(localStorage.getItem(key) || '[]').map((id) => Number(id)).filter((id) => Number.isFinite(id))
        const newId = Number(res.id)
        if (Number.isFinite(newId) && !ids.includes(newId)) {
          localStorage.setItem(key, JSON.stringify([...ids, newId]))
        }
      }
      navigate('/recommendations')
    } else {
      setError(res.error || t.failedCreate)
    }
    setLoading(false)
  }

  return (
    <div className={`mx-auto max-w-2xl rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-8 shadow-sm`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.headerTitle}</h2>
      <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.authNote}</p>
        </div>
      {!isAuthenticated && <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">{t.loginFirst}</div>}
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} sm:col-span-2`}>
          {t.title}
          <input value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder={t.titlePlaceholder} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>
        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {t.brand}
          <>
            <input list="brand-options" value={form.brand} onChange={e=>setForm({...form, brand: e.target.value})} placeholder={t.brandPlaceholder} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
            <datalist id="brand-options">
              {brandOptions.map((brand) => <option key={brand} value={brand} />)}
            </datalist>
          </>
        </label>
        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {t.model}
          <>
            <input list="model-options" value={form.model} onChange={e=>setForm({...form, model: e.target.value})} placeholder={t.modelPlaceholder} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
            <datalist id="model-options">
              {modelOptions.map((model) => <option key={model} value={model} />)}
            </datalist>
          </>
        </label>
        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {t.price}
          <input value={form.price} onChange={e=>setForm({...form, price: e.target.value})} placeholder={t.pricePlaceholder} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>
        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {t.year}
          <input value={form.year} onChange={e=>setForm({...form, year: e.target.value})} placeholder={t.yearPlaceholder} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>
        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {t.mileage}
          <input value={form.mileage} onChange={e=>setForm({...form, mileage: e.target.value})} placeholder={t.mileagePlaceholder} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>
        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} sm:col-span-2`}>
          {t.description}
          <textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} placeholder={t.descriptionPlaceholder} className={`min-h-32 rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>

        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} sm:col-span-2`}>
          {t.photosNote}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
                if (files.length > 10) {
                setError(t.photoLimitError)
                setPhotos(files.slice(0, 10))
                return
              }
              setError(null)
              setPhotos(files)
            }}
            className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}
          />
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.selectedPhotos.replace('{count}', String(photos.length))}</span>
        </label>

        {photoPreviews.length > 0 && (
          <div className="sm:col-span-2 grid grid-cols-2 gap-3 md:grid-cols-3">
            {photoPreviews.map((item) => (
              <div key={item.preview} className={`overflow-hidden rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
                <img src={item.preview} alt={item.file.name} className="h-32 w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="sm:col-span-2 flex flex-col gap-3">
          <button disabled={!isAuthenticated || loading} className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70">
            {loading ? t.creating : t.create}
          </button>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        </div>
      </form>
    </div>
  )
}



