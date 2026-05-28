import React, { useEffect, useMemo, useState, useContext } from 'react'
import { getListings } from '../api/listings'
import { createListing } from '../api/listings'
import { useNavigate } from 'react-router-dom'
import { getToken, getCurrentUsername } from '../api/auth'
import { ThemeContext } from '../context/ThemeContext'
import { LanguageContext } from '../context/LanguageContext'
import { CITY_OPTIONS_UK, toCanonicalCity, translateCity } from '../utils/cities'
import { translateValue } from '../utils/translations'

const FUEL_OPTIONS = ['Бензин', 'Дизель', 'Газ (LPG)', 'Газ (CNG)', 'Гібрид', 'Електро']
const FUEL_OPTIONS_MOTO = ['Бензин', 'Електро']
const TRANSMISSION_OPTIONS = ['Механіка', 'Автомат', 'Варіатор', 'Робот']
const TRANSMISSION_OPTIONS_MOTO = ['Варіатор', 'Механіка', 'Автомат']
const BODY_OPTIONS_CAR = ['Седан', 'Хетчбек', 'Універсал', 'Кросовер', 'Позашляховик', 'Мікровен', 'Купе', 'Кабріолет']
const BODY_OPTIONS_MOTO = ['Нейкед', 'Спортбайк', 'Круізер', 'Туристичний', 'Ендуро', 'Мопед/Скутер']
const COLOR_OPTIONS = ['Чорний', 'Білий', 'Сірий', 'Сріблистий', 'Червоний', 'Блакитний', 'Синій', 'Зелений', 'Жовтий', 'Коричневий', 'Золотий', 'Помаранчевий']
const DRIVE_OPTIONS = ['Передній', 'Задній', 'Повний']
const CONDITION_OPTIONS = ['Відмінний', 'Хороший', 'Задовільний', 'Требує ремонту']

export default function CreateListing() {
  const { isDark } = useContext(ThemeContext)
  const { language } = useContext(LanguageContext)
  const t = language === 'en' ? {
    eyebrow: 'Create listing',
    headerTitle: 'Create listing',
    headerDesc: 'Fill in the main vehicle details, add photos and publish the listing in a few minutes.',
    loginFirst: 'Please login first',
    title: 'Title', titlePlaceholder: 'Honda Accord 2019',
    brand: 'Brand', brandPlaceholder: 'Honda',
    model: 'Model', modelPlaceholder: 'Accord',
    price: 'Price', pricePlaceholder: '7500',
    year: 'Year', yearPlaceholder: '2019',
    mileage: 'Mileage', mileagePlaceholder: '65000',
    description: 'Description', descriptionPlaceholder: 'Good condition, regularly serviced…',
    photosNote: 'Photos up to 10 items',
    selectedPhotos: 'Selected {count} / 10',
    photoLimitError: 'You can add maximum 10 photos',
    creating: 'Creating…', create: 'Create', failedCreate: 'Failed to create',
    cars: 'Cars', motos: 'Motos',
    vehicleType: 'Vehicle type',
    fuelType: 'Fuel type', transmission: 'Transmission',
    bodyType: 'Body type', color: 'Color', driveType: 'Drive type',
    condition: 'Condition', engineVol: 'Engine volume (L)',
    city: 'City', cityPlaceholder: 'Enter city or choose from the list', customs: 'Customs cleared',
    anyOption: 'Select…',
  } : {
    eyebrow: 'Створення оголошення',
    headerTitle: 'Створити оголошення',
    headerDesc: 'Заповніть основні характеристики транспорту, додайте фото й опублікуйте оголошення за кілька хвилин.',
    loginFirst: 'Спочатку увійдіть',
    title: 'Назва', titlePlaceholder: 'Honda Accord 2019',
    brand: 'Марка', brandPlaceholder: 'Honda',
    model: 'Модель', modelPlaceholder: 'Accord',
    price: 'Ціна', pricePlaceholder: '7500',
    year: 'Рік', yearPlaceholder: '2019',
    mileage: 'Пробіг', mileagePlaceholder: '65000',
    description: 'Опис', descriptionPlaceholder: 'Добрий стан, регулярно обслуговувався…',
    photosNote: 'Фото до 10 штук',
    selectedPhotos: 'Обрано {count} / 10',
    photoLimitError: 'Можна додати максимум 10 фото',
    creating: 'Створення…', create: 'Створити', failedCreate: 'Не вдалося створити',
    cars: 'Авто', motos: 'Мото',
    vehicleType: 'Тип транспорту',
    fuelType: 'Тип палива', transmission: 'Трансмісія',
    bodyType: 'Тип кузова', color: 'Колір', driveType: 'Привід',
    condition: 'Стан', engineVol: 'Об\'єм двигуна (л)',
    city: 'Місто', cityPlaceholder: 'Введіть місто або виберіть зі списку', customs: 'Розмитнений',
    anyOption: 'Оберіть…',
  }

  const [form, setForm] = useState({
    title: '', description: '', price: '', year: '', mileage: '', brand: '', model: '',
    vehicleType: 'car',
      fuelType: '', transmission: '', bodyType: '', color: '', driveType: '', condition: '',
      engineVolume: '', city: '', customsCleared: false,
  })
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [catalogListings, setCatalogListings] = useState([])
  const navigate = useNavigate()
  const isAuthenticated = Boolean(getToken())

  const photoPreviews = useMemo(() => photos.map((file) => ({ file, preview: URL.createObjectURL(file) })), [photos])

  const brandOptions = useMemo(() => {
    const dbBrands = catalogListings.map((i) => i.brand).filter(Boolean)
    const extraCars = ['Audi', 'BMW', 'Chevrolet', 'Citroen', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Kia', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Renault', 'SEAT', 'Skoda', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo']
    const extraMoto = ['Aprilia', 'BMW', 'Ducati', 'Harley-Davidson', 'Honda', 'Indian', 'Kawasaki', 'KTM', 'Suzuki', 'Triumph', 'Yamaha']
    return [...new Set([...dbBrands, ...extraCars, ...extraMoto])].sort((a, b) => a.localeCompare(b))
  }, [catalogListings])

  const modelOptions = useMemo(() => {
    const dbModels = catalogListings.map((i) => i.model).filter(Boolean)
    const extra = ['Accord', 'A4', 'Camry', 'Civic', 'Corolla', 'CX-5', 'Focus', 'Golf', 'Model 3', 'MT-07', 'Ninja 400', 'Octavia', 'RAV4', 'X5']
    return [...new Set([...dbModels, ...extra])].sort((a, b) => a.localeCompare(b))
  }, [catalogListings])

  const bodyOptions = form.vehicleType === 'motorcycle' ? BODY_OPTIONS_MOTO : BODY_OPTIONS_CAR
  const fuelOptions = form.vehicleType === 'motorcycle' ? FUEL_OPTIONS_MOTO : FUEL_OPTIONS
  const transmissionOptions = form.vehicleType === 'motorcycle' ? TRANSMISSION_OPTIONS_MOTO : TRANSMISSION_OPTIONS

  useEffect(() => {
    return () => photoPreviews.forEach((item) => URL.revokeObjectURL(item.preview))
  }, [photoPreviews])

  useEffect(() => {
    let mounted = true
    getListings().then((data) => { if (mounted && Array.isArray(data)) setCatalogListings(data) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    // Keep form values valid when switching vehicle type.
    if (form.vehicleType === 'motorcycle' && form.driveType) {
      setField('driveType', '')
    }
    if (form.fuelType && !fuelOptions.includes(form.fuelType)) {
      setField('fuelType', '')
    }
    if (form.transmission && !transmissionOptions.includes(form.transmission)) {
      setField('transmission', '')
    }
    if (form.bodyType && !bodyOptions.includes(form.bodyType)) {
      setField('bodyType', '')
    }
  }, [form.vehicleType])

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      price: parseFloat(form.price),
      year: parseInt(form.year || 0),
      mileage: parseInt(form.mileage || 0),
      engineVolume: form.engineVolume !== '' ? parseFloat(form.engineVolume) : null,
      driveType: form.vehicleType === 'motorcycle' ? null : (form.driveType || null),
      city: toCanonicalCity(form.city),
      customsCleared: form.customsCleared,
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

  const inputCls = `rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`
  const selectCls = `rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`
  const labelCls = `flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`

  return (
    <div className="space-y-8">
      <section className={`rounded-3xl p-6 shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">{t.eyebrow}</p>
            <h1 className={`mt-2 text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.headerTitle}</h1>
            <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.headerDesc}</p>
          </div>
          {!isAuthenticated && <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">{t.loginFirst}</div>}
        </div>
      </section>

      <section className={`mx-auto max-w-2xl rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-8 shadow-sm`}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">

        {/* Vehicle type toggle */}
        <div className="sm:col-span-2 flex flex-col gap-2">
          <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.vehicleType}</span>
          <div className={`relative flex rounded-2xl p-1 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
            <span
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-sky-500 shadow-md transition-transform duration-300 ease-in-out"
              style={{ transform: form.vehicleType === 'motorcycle' ? 'translateX(calc(100% + 8px))' : 'translateX(0)' }}
            />
            <button type="button"
              onClick={() => setField('vehicleType', 'car')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors duration-200 ${form.vehicleType === 'car' ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <span></span>{t.cars}
            </button>
            <button type="button"
              onClick={() => {
                setField('vehicleType', 'motorcycle')
                setField('driveType', '')
              }}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors duration-200 ${form.vehicleType === 'motorcycle' ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <span>️</span>{t.motos}
            </button>
          </div>
        </div>

        {/* Title */}
        <label className={`${labelCls} sm:col-span-2`}>
          {t.title}
          <input value={form.title} onChange={e => setField('title', e.target.value)} placeholder={t.titlePlaceholder} className={inputCls} />
        </label>

        {/* Brand + Model */}
        <label className={labelCls}>
          {t.brand}
          <input list="brand-options" value={form.brand} onChange={e => setField('brand', e.target.value)} placeholder={t.brandPlaceholder} className={inputCls} />
          <datalist id="brand-options">{brandOptions.map((b) => <option key={b} value={b} />)}</datalist>
        </label>
        <label className={labelCls}>
          {t.model}
          <input list="model-options" value={form.model} onChange={e => setField('model', e.target.value)} placeholder={t.modelPlaceholder} className={inputCls} />
          <datalist id="model-options">{modelOptions.map((m) => <option key={m} value={m} />)}</datalist>
        </label>

        {/* Price + Year */}
        <label className={labelCls}>
          {t.price}
          <input type="number" min="0" value={form.price} onChange={e => setField('price', e.target.value)} placeholder={t.pricePlaceholder} className={inputCls} />
        </label>
        <label className={labelCls}>
          {t.year}
          <input type="number" min="1900" max="2026" value={form.year} onChange={e => setField('year', e.target.value)} placeholder={t.yearPlaceholder} className={inputCls} />
        </label>

        {/* Mileage + Engine volume */}
        <label className={labelCls}>
          {t.mileage}
          <input type="number" min="0" value={form.mileage} onChange={e => setField('mileage', e.target.value)} placeholder={t.mileagePlaceholder} className={inputCls} />
        </label>
        <label className={labelCls}>
          {t.engineVol}
          <input type="number" step="0.1" min="0" value={form.engineVolume} onChange={e => setField('engineVolume', e.target.value)} placeholder="1.6" className={inputCls} />
        </label>

        {/* Fuel + Transmission */}
        <label className={labelCls}>
          {t.fuelType}
          <select value={form.fuelType} onChange={e => setField('fuelType', e.target.value)} className={selectCls}>
            <option value="">{t.anyOption}</option>
            {fuelOptions.map(f => <option key={f} value={f}>{translateValue(f, language)}</option>)}
          </select>
        </label>
        <label className={labelCls}>
          {t.transmission}
          <select value={form.transmission} onChange={e => setField('transmission', e.target.value)} className={selectCls}>
            <option value="">{t.anyOption}</option>
            {transmissionOptions.map(tr => <option key={tr} value={tr}>{translateValue(tr, language)}</option>)}
          </select>
        </label>

        {/* Body type + Color */}
        <label className={labelCls}>
          {t.bodyType}
          <select value={form.bodyType} onChange={e => setField('bodyType', e.target.value)} className={selectCls}>
            <option value="">{t.anyOption}</option>
            {bodyOptions.map(b => <option key={b} value={b}>{translateValue(b, language)}</option>)}
          </select>
        </label>
        <label className={labelCls}>
          {t.color}
          <select value={form.color} onChange={e => setField('color', e.target.value)} className={selectCls}>
            <option value="">{t.anyOption}</option>
            {COLOR_OPTIONS.map(c => <option key={c} value={c}>{translateValue(c, language)}</option>)}
          </select>
        </label>

        {/* Drive type + Condition */}
        {form.vehicleType !== 'motorcycle' && (
        <label className={labelCls}>
          {t.driveType}
          <select value={form.driveType} onChange={e => setField('driveType', e.target.value)} className={selectCls}>
            <option value="">{t.anyOption}</option>
            {DRIVE_OPTIONS.map(d => <option key={d} value={d}>{translateValue(d, language)}</option>)}
          </select>
        </label>
        )}
        <label className={labelCls}>
          {t.condition}
          <select value={form.condition} onChange={e => setField('condition', e.target.value)} className={selectCls}>
            <option value="">{t.anyOption}</option>
            {CONDITION_OPTIONS.map(c => <option key={c} value={c}>{translateValue(c, language)}</option>)}
          </select>
        </label>

        {/* City */}
        <label className={labelCls}>
          {t.city}
          <input
            list="city-options"
            value={form.city}
            onChange={e => setField('city', e.target.value)}
            placeholder={t.cityPlaceholder}
            className={inputCls}
          />
          <datalist id="city-options">
            {CITY_OPTIONS_UK.map(c => <option key={c} value={c}>{translateCity(c, language)}</option>)}
          </datalist>
        </label>

        {/* Customs cleared */}
        <label className={`flex items-center gap-3 text-sm font-medium cursor-pointer sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          <div
            onClick={() => setField('customsCleared', !form.customsCleared)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${form.customsCleared ? 'bg-sky-500' : isDark ? 'bg-slate-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.customsCleared ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
          {t.customs}
        </label>

        {/* Description */}
        <label className={`${labelCls} sm:col-span-2`}>
          {t.description}
          <textarea value={form.description} onChange={e => setField('description', e.target.value)} placeholder={t.descriptionPlaceholder} className={`min-h-32 ${inputCls}`} />
        </label>

        {/* Photos */}
        <label className={`${labelCls} sm:col-span-2`}>
          {t.photosNote}
          <input
            type="file" accept="image/*" multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              if (files.length > 10) { setError(t.photoLimitError); setPhotos(files.slice(0, 10)); return }
              setError(null); setPhotos(files)
            }}
            className={inputCls}
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
      </section>
    </div>
  )
}
