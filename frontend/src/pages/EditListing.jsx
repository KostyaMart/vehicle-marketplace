import React, { useEffect, useState, useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getListing, updateListing } from '../api/listings'
import { getToken } from '../api/auth'
import { ThemeContext } from '../context/ThemeContext'

export default function EditListing() {
  const { isDark } = useContext(ThemeContext)
  const navigate = useNavigate()
  const { id } = useParams()

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
  })

  useEffect(() => {
    async function load() {
      if (!getToken()) {
        navigate('/login')
        return
      }
      setLoading(true)
      const data = await getListing(id)
      if (data?.error || !data?.id) {
        setError(data?.error || 'Не вдалося завантажити оголошення')
      } else {
        setForm({
          title: data.title || '',
          description: data.description || '',
          price: data.price ?? '',
          year: data.year ?? '',
          mileage: data.mileage ?? '',
          brand: data.brand || '',
          model: data.model || '',
        })
      }
      setLoading(false)
    }

    load()
  }, [id, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const current = await getListing(id)
    if (current?.error || !current?.id) {
      setError('Не вдалося оновити оголошення')
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
    return <div className={`rounded-2xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>Завантаження...</div>
  }

  return (
    <div className={`mx-auto max-w-2xl rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-8 shadow-sm`}>
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Редагувати оголошення</h2>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} sm:col-span-2`}>
          Назва
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>

        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          Марка
          <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>

        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          Модель
          <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>

        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          Ціна
          <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>

        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          Рік
          <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>

        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          Пробіг
          <input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>

        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} sm:col-span-2`}>
          Опис
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`min-h-32 rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>

        <div className="sm:col-span-2 flex flex-col gap-3">
          <button disabled={saving} className="rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-70">
            {saving ? 'Збереження...' : 'Зберегти зміни'}
          </button>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        </div>
      </form>
    </div>
  )
}

