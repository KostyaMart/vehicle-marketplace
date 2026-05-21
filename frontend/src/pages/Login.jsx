import React, { useState, useContext } from 'react'
import { login, saveToken } from '../api/auth'
import { useNavigate } from 'react-router-dom'
import { ThemeContext } from '../context/ThemeContext'

export default function Login() {
  const { isDark } = useContext(ThemeContext)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const data = await login(username, password)
    if (data.token) {
      saveToken(data.token)
      navigate('/recommendations')
    } else {
      setError(data.error || 'Помилка входу')
    }
    setLoading(false)
  }

  return (
    <div className={`mx-auto max-w-md rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-8 shadow-sm`}>
    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Вхід</h2>
    <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Використайте `testuser / password` для тестового облікового запису.</p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
      Ім'я користувача
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ім'я користувача" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>
        <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
      Пароль
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="пароль" className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`} />
        </label>
        <button disabled={loading} className="rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70">
      {loading ? 'Вхід…' : 'Увійти'}
        </button>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      </form>
    </div>
  )
}

