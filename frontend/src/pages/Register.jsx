import React, { useState, useContext } from 'react'
import { register, saveSession } from '../api/auth'
import { useNavigate } from 'react-router-dom'
import { ThemeContext } from '../context/ThemeContext'

export default function Register() {
  const { isDark } = useContext(ThemeContext)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Basic validations
    const emailRe = /^\S+@\S+\.\S+$/
    const phoneRe = /^[+\d][\d\s()-]{6,20}$/
    const nameRe = /^[\p{L} '-]{1,60}$/u
    if (!email || !emailRe.test(email)) {
      setError('Невірний email')
      setLoading(false)
      return
    }
    if (!phone || !phoneRe.test(phone)) {
      setError('Невірний номер телефону')
      setLoading(false)
      return
    }
    if (!firstName || !nameRe.test(firstName)) {
      setError("Невірне ім'я")
      setLoading(false)
      return
    }
    if (!lastName || !nameRe.test(lastName)) {
      setError('Невірне прізвище')
      setLoading(false)
      return
    }
    if (!password || password.length < 6) {
      setError('Пароль має бути не менше 6 символів')
      setLoading(false)
      return
    }
    if (password !== confirmPassword) {
      setError('Паролі не співпадають')
      setLoading(false)
      return
    }

    const username = email || phone
    const payload = { username, password, email, phone, firstName, lastName }
    const data = await register(payload)
    if (data.token) {
      const userObj = data.user || { username, email, phone, firstName, lastName }
      saveSession({ token: data.token, user: userObj })
      navigate('/recommendations')
    } else {
      setError(data.error || 'Помилка реєстрації')
    }
    setLoading(false)
  }

  return (
    <div className={`mx-auto max-w-md rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-8 shadow-sm`}>
    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Реєстрація</h2>
    <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Створіть новий обліковий запис і одразу отримаєте JWT.</p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
      Email
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>

        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
      Номер телефону
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380 63 000 0000" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
      Ім'я
      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ім'я" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
          </label>
          <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
      Прізвище
      <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Прізвище" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
          </label>
        </div>

        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
      Пароль
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="пароль" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>

        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
      Повторіть пароль
      <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="повторіть пароль" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>

        <button disabled={loading} className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70">
      {loading ? 'Створення…' : 'Зареєструватися'}
        </button>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      </form>
    </div>
  )
}




