import React, { useEffect, useState, useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getListing, updateListing } from '../api/listings'
import { getToken } from '../api/auth'
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

export default function EditListing() {
  const { isDark } = useContext(ThemeContext)
  const { language } = useContext(LanguageContext)
  const navigate = useNavigate()
  const { id } = useParams()

  const t = language === 'en' ? {
    loading: 'Loading...',
    pageTitle: 'Edit listing',
    title: 'Title',
    brand: 'Brand',
    model: 'Model',
    price: 'Price',
    year: 'Year',
    mileage: 'Mileage',
    description: 'Description',
    vehicleType: 'Vehicle type',
    cars: 'Cars',
    motos: 'Motos',
    fuelType: 'Fuel type',
    transmission: 'Transmission',
    bodyType: 'Body type',
    color: 'Color',
    driveType: 'Drive type',
    condition: 'Condition',
    engineVol: 'Engine volume (L)',
    city: 'City',
    cityPlaceholder: 'Enter city or choose from the list',
    customs: 'Customs cleared',
    anyOption: 'Select…',
    save: 'Save changes',
    saving: 'Saving...',
    loadFail: 'Failed to load listing',
    updateFail: 'Failed to update listing',
  } : {
    loading: 'Завантаження...',
    pageTitle: 'Редагувати оголошення',
    title: 'Назва',
    brand: 'Марка',
    model: 'Модель',
    price: 'Ціна',
    year: 'Рік',
    mileage: 'Пробіг',
    description: 'Опис',
    vehicleType: 'Тип транспорту',
    cars: 'Авто',
    motos: 'Мото',
    fuelType: 'Тип палива',
    transmission: 'Трансмісія',
    bodyType: 'Тип кузова',
    color: 'Колір',
    driveType: 'Привід',
    condition: 'Стан',
    engineVol: "Об'єм двигуна (л)",
    city: 'Місто',
    cityPlaceholder: 'Введіть місто або виберіть зі списку',
    customs: 'Розмитнений',
    anyOption: 'Оберіть…',
    save: 'Зберегти зміни',
    saving: 'Збереження...',
    loadFail: 'Не вдалося завантажити оголошення',
    updateFail: 'Не вдалося оновити оголошення',
  }

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    year: '',
    mileage: '',
    brand: '',
    model: '',
    vehicleType: 'car',
    fuelType: '',
    transmission: '',
    bodyType: '',
    color: '',
    driveType: '',
    condition: '',
    engineVolume: '',
    city: '',
    customsCleared: false,
  })

  const bodyOptions = form.vehicleType === 'motorcycle' ? BODY_OPTIONS_MOTO : BODY_OPTIONS_CAR
  const fuelOptions = form.vehicleType === 'motorcycle' ? FUEL_OPTIONS_MOTO : FUEL_OPTIONS
  const transmissionOptions = form.vehicleType === 'motorcycle' ? TRANSMISSION_OPTIONS_MOTO : TRANSMISSION_OPTIONS

  const inputCls = `rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`
  const selectCls = `rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`
  const labelCls = `flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`

  useEffect(() => {
    async function load() {
      if (!getToken()) {
        navigate('/login')
        return
      }
      setLoading(true)
      const data = await getListing(id)
      if (data?.error || !data?.id) {
        setError(data?.error || t.loadFail)
      } else {
        setForm({
          title: data.title || '',
          description: data.description || '',
          price: data.price ?? '',
          year: data.year ?? '',
          mileage: data.mileage ?? '',
          brand: data.brand || '',
          model: data.model || '',
          vehicleType: data.vehicleType || 'car',
          fuelType: data.fuelType || '',
          transmission: data.transmission || '',
          bodyType: data.bodyType || '',
          color: data.color || '',
          driveType: data.driveType || '',
          condition: data.condition || '',
          engineVolume: data.engineVolume ?? '',
          city: toCanonicalCity(data.city || ''),
          customsCleared: !!data.customsCleared,
        })
      }
      setLoading(false)
    }

    load()
  }, [id, navigate, t.loadFail])

  useEffect(() => {
    if (form.vehicleType === 'motorcycle' && form.driveType) {
      setForm((prev) => ({ ...prev, driveType: '' }))
    }
    if (form.fuelType && !fuelOptions.includes(form.fuelType)) {
      setForm((prev) => ({ ...prev, fuelType: '' }))
    }
    if (form.transmission && !transmissionOptions.includes(form.transmission)) {
      setForm((prev) => ({ ...prev, transmission: '' }))
    }
    if (form.bodyType && !bodyOptions.includes(form.bodyType)) {
      setForm((prev) => ({ ...prev, bodyType: '' }))
    }
  }, [form.vehicleType])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const current = await getListing(id)
    if (current?.error || !current?.id) {
      setError(t.updateFail)
      setSaving(false)
      return
    }

    const payload = {
      ...current,
      title: form.title,
      description: form.description,
      price: Number(form.price),
      year: Number(form.year),
      mileage: Number(form.mileage),
      brand: form.brand,
      model: form.model,
      vehicleType: form.vehicleType,
      fuelType: form.fuelType || null,
      transmission: form.transmission || null,
      bodyType: form.bodyType || null,
      color: form.color || null,
      driveType: form.vehicleType === 'motorcycle' ? null : (form.driveType || null),
      condition: form.condition || null,
      engineVolume: form.engineVolume !== '' ? Number(form.engineVolume) : null,
      city: toCanonicalCity(form.city),
      customsCleared: !!form.customsCleared,
    }

    const result = await updateListing(id, payload)
    if (result?.error) {
      setError(result.error)
    } else {
      navigate('/profile')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className={`rounded-2xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>{t.loading}</div>
  }

  return (
    <div className={`mx-auto max-w-2xl rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-8 shadow-sm`}>
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.pageTitle}</h2>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 flex flex-col gap-2">
          <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.vehicleType}</span>
          <div className={`relative flex rounded-2xl p-1 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
            <span
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-sky-500 shadow-md transition-transform duration-300 ease-in-out"
              style={{ transform: form.vehicleType === 'motorcycle' ? 'translateX(calc(100% + 8px))' : 'translateX(0)' }}
            />
            <button type="button"
              onClick={() => setForm((prev) => ({ ...prev, vehicleType: 'car' }))}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors duration-200 ${form.vehicleType === 'car' ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <span></span>{t.cars}
            </button>
            <button type="button"
              onClick={() => setForm((prev) => ({ ...prev, vehicleType: 'motorcycle', driveType: '' }))}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors duration-200 ${form.vehicleType === 'motorcycle' ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <span>️</span>{t.motos}
            </button>
          </div>
        </div>

        <label className={`${labelCls} sm:col-span-2`}>
          {t.title}
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
        </label>

        <label className={labelCls}>
          {t.brand}
          <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputCls} />
        </label>

        <label className={labelCls}>
          {t.model}
          <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={inputCls} />
        </label>

        <label className={labelCls}>
          {t.price}
          <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
        </label>

        <label className={labelCls}>
          {t.year}
          <input type="number" min="1900" max="2026" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={inputCls} />
        </label>

        <label className={labelCls}>
          {t.mileage}
          <input type="number" min="0" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className={inputCls} />
        </label>

        <label className={labelCls}>
          {t.engineVol}
          <input type="number" step="0.1" min="0" value={form.engineVolume} onChange={(e) => setForm({ ...form, engineVolume: e.target.value })} className={inputCls} />
        </label>

        <label className={labelCls}>
          {t.fuelType}
          <select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} className={selectCls}>
            <option value="">{t.anyOption}</option>
            {fuelOptions.map((f) => <option key={f} value={f}>{translateValue(f, language)}</option>)}
          </select>
        </label>

        <label className={labelCls}>
          {t.transmission}
          <select value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })} className={selectCls}>
            <option value="">{t.anyOption}</option>
            {transmissionOptions.map((tr) => <option key={tr} value={tr}>{translateValue(tr, language)}</option>)}
          </select>
        </label>

        <label className={labelCls}>
          {t.bodyType}
          <select value={form.bodyType} onChange={(e) => setForm({ ...form, bodyType: e.target.value })} className={selectCls}>
            <option value="">{t.anyOption}</option>
            {bodyOptions.map((b) => <option key={b} value={b}>{translateValue(b, language)}</option>)}
          </select>
        </label>

        <label className={labelCls}>
          {t.color}
          <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className={selectCls}>
            <option value="">{t.anyOption}</option>
            {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{translateValue(c, language)}</option>)}
          </select>
        </label>

        {form.vehicleType !== 'motorcycle' && (
        <label className={labelCls}>
          {t.driveType}
          <select value={form.driveType} onChange={(e) => setForm({ ...form, driveType: e.target.value })} className={selectCls}>
            <option value="">{t.anyOption}</option>
            {DRIVE_OPTIONS.map((d) => <option key={d} value={d}>{translateValue(d, language)}</option>)}
          </select>
        </label>
        )}

        <label className={labelCls}>
          {t.condition}
          <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={selectCls}>
            <option value="">{t.anyOption}</option>
            {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{translateValue(c, language)}</option>)}
          </select>
        </label>

        <label className={labelCls}>
          {t.city}
          <input
            list="city-options"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder={t.cityPlaceholder}
            className={inputCls}
          />
          <datalist id="city-options">
            {CITY_OPTIONS_UK.map((c) => <option key={c} value={c}>{translateCity(c, language)}</option>)}
          </datalist>
        </label>

        <label className={`flex items-center gap-3 text-sm font-medium cursor-pointer sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          <div
            onClick={() => setForm((prev) => ({ ...prev, customsCleared: !prev.customsCleared }))}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${form.customsCleared ? 'bg-sky-500' : isDark ? 'bg-slate-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.customsCleared ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
          {t.customs}
        </label>

        <label className={`${labelCls} sm:col-span-2`}>
          {t.description}
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`min-h-32 ${inputCls}`} />
        </label>

        <div className="sm:col-span-2 flex flex-col gap-3">
          <button disabled={saving} className="rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-70">
            {saving ? t.saving : t.save}
          </button>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        </div>
      </form>
    </div>
  )
}

