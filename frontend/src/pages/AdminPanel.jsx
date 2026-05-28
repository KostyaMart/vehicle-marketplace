import React, { useEffect, useMemo, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { ThemeContext } from '../context/ThemeContext'
import { LanguageContext } from '../context/LanguageContext'
import { fetchCurrentUser, getCurrentUser, getToken, setCurrentUser as saveCurrentUser } from '../api/auth'
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getAdminListings,
  updateAdminListing,
  deleteAdminListing,
  getFeedbacks,
  markFeedbackAsRead,
  deleteFeedback,
} from '../api/admin'
import { cleanListingTitle } from '../utils/listingTitle'

const MAX_PRODUCTION_YEAR = 2026

const tMap = {
   uk: {
     eyebrow: 'Керування платформою',
     title: 'Адмін-панель',
     subtitle: 'Переглядайте статистику, керуйте користувачами, оголошеннями та зверненнями з єдиного інтерфейсу.',
     forbidden: 'Доступ заборонено',
     backHome: 'На головну',
     dashboard: 'Статистика',
     users: 'Користувачі',
     listings: 'Оголошення',
     feedback: 'Повідомлення звязку',
     totalUsers: 'Всього користувачів',
    totalListings: 'Всього оголошень',
    totalCars: 'Авто',
    totalMotorcycles: 'Мото',
    avgPrice: 'Середня ціна',
    newest7d: 'Нові за 7 днів',
    loading: 'Завантаження...',
    id: 'ID',
    username: 'Логін',
    email: 'Email',
    role: 'Роль',
    createdAt: 'Створено',
    listingsCount: 'Оголошень',
    actions: 'Дії',
    makeAdmin: 'Зробити ADMIN',
    makeUser: 'Зробити USER',
    delete: 'Видалити',
    edit: 'Редагувати',
    open: 'Відкрити',
    save: 'Зберегти',
    cancel: 'Скасувати',
    confirmDeleteUser: 'Видалити користувача?',
    confirmDeleteListing: 'Видалити оголошення?',
    owner: 'Власник',
    titleCol: 'Назва',
    brand: 'Марка',
    model: 'Модель',
    price: 'Ціна',
    year: 'Рік',
    mileage: 'Пробіг',
     vehicleType: 'Тип',
     noData: 'Дані відсутні',
     senderName: 'Від',
     feedbackMessage: 'Повідомлення',
     feedbackDate: 'Дата',
     markRead: 'Прочитано',
     markUnread: 'Не прочитано',
     photos: 'Фото',
     addPhoto: 'Додати фото',
     removePhoto: 'Видалити фото',
     photoUrlPlaceholder: 'https://example.com/photo.jpg',
     noPhotos: 'Немає фото',
     searchListing: 'Пошук оголошення',
     searchListingPlaceholder: 'Пошук за назвою, маркою, моделлю, містом, власником...',
   },
   en: {
     eyebrow: 'Platform management',
     title: 'Admin Panel',
     subtitle: 'Review statistics, manage users, listings, and feedback from a single workspace.',
     forbidden: 'Access denied',
     backHome: 'Back home',
     dashboard: 'Dashboard',
     users: 'Users',
     listings: 'Listings',
     feedback: 'Feedback Messages',
     totalUsers: 'Total users',
    totalListings: 'Total listings',
    totalCars: 'Cars',
    totalMotorcycles: 'Motorcycles',
    avgPrice: 'Average price',
    newest7d: 'New in 7 days',
    loading: 'Loading...',
    id: 'ID',
    username: 'Username',
    email: 'Email',
    role: 'Role',
    createdAt: 'Created at',
    listingsCount: 'Listings',
    actions: 'Actions',
    makeAdmin: 'Make ADMIN',
    makeUser: 'Make USER',
    delete: 'Delete',
    edit: 'Edit',
    open: 'Open',
    save: 'Save',
    cancel: 'Cancel',
    confirmDeleteUser: 'Delete user?',
    confirmDeleteListing: 'Delete listing?',
    owner: 'Owner',
    titleCol: 'Title',
    brand: 'Brand',
    model: 'Model',
    price: 'Price',
    year: 'Year',
    mileage: 'Mileage',
     vehicleType: 'Type',
     noData: 'No data',
     senderName: 'From',
     feedbackMessage: 'Message',
     feedbackDate: 'Date',
     markRead: 'Read',
     markUnread: 'Unread',
     photos: 'Photos',
     addPhoto: 'Add photo',
     removePhoto: 'Remove photo',
     photoUrlPlaceholder: 'https://example.com/photo.jpg',
     noPhotos: 'No photos',
     searchListing: 'Search listing',
     searchListingPlaceholder: 'Search by title, brand, model, city, owner...',
   },
}

function clampListingYear(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  const year = Math.trunc(parsed)
  return Math.min(MAX_PRODUCTION_YEAR, Math.max(1900, year))
}

function normalizeListingYear(item) {
  if (!item) return item
  return { ...item, year: clampListingYear(item.year) }
}

function formatMoney(value) {
  if (typeof value !== 'number') return '—'
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value))}`
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('uk-UA')
  } catch {
    return '—'
  }
}

function isAdminUser(user) {
  const role = String(user?.role || user?.roles || '').toUpperCase()
  return role.includes('ADMIN')
}

export default function AdminPanel() {
  const { isDark } = useContext(ThemeContext)
  const { language } = useContext(LanguageContext)
  const t = tMap[language] || tMap.uk

   const [currentUser, setCurrentUserState] = useState(() => getCurrentUser())
   const [stats, setStats] = useState(null)
   const [users, setUsers] = useState([])
   const [listings, setListings] = useState([])
   const [feedbacks, setFeedbacks] = useState([])
   const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingUserId, setSavingUserId] = useState(null)
  const [savingListingId, setSavingListingId] = useState(null)
  const [editingListing, setEditingListing] = useState(null)
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [listingQuery, setListingQuery] = useState('')

  const canAccess = useMemo(() => isAdminUser(currentUser), [currentUser])

  useEffect(() => {
    const sync = () => setCurrentUserState(getCurrentUser())
    window.addEventListener('auth-change', sync)
    return () => window.removeEventListener('auth-change', sync)
  }, [])

  useEffect(() => {
    let mounted = true
    async function hydrateUser() {
      if (!getToken()) return
      if (isAdminUser(getCurrentUser()) || String(getCurrentUser()?.role || getCurrentUser()?.roles || '').toUpperCase().includes('USER')) {
        return
      }

      const me = await fetchCurrentUser()
      if (!mounted || !me?.user) return
      saveCurrentUser(me.user)
      setCurrentUserState(me.user)
    }
    hydrateUser()
    return () => {
      mounted = false
    }
  }, [])

   useEffect(() => {
     if (!canAccess) return

     let mounted = true
     async function loadAll() {
       setLoading(true)
       setError('')

       const [statsRes, usersRes, listingsRes, feedbacksRes] = await Promise.all([
         getAdminStats(),
         getAdminUsers(),
         getAdminListings(),
         getFeedbacks(),
       ])

       if (!mounted) return
       if (statsRes?.error || usersRes?.error || listingsRes?.error) {
         setError(statsRes.error || usersRes.error || listingsRes.error)
         setLoading(false)
         return
       }

       setStats(statsRes)
       setUsers(Array.isArray(usersRes) ? usersRes : [])
       setListings(Array.isArray(listingsRes) ? listingsRes.map(normalizeListingYear) : [])
       setFeedbacks(Array.isArray(feedbacksRes) ? feedbacksRes : [])
       setLoading(false)
     }

     loadAll()
     return () => {
       mounted = false
     }
   }, [canAccess])

  async function onRoleToggle(user) {
    const nextRole = String(user.role || '').toUpperCase() === 'ADMIN' ? 'USER' : 'ADMIN'
    setSavingUserId(user.id)
    const res = await updateUserRole(user.id, nextRole)
    if (!res?.error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: nextRole } : u))
    }
    setSavingUserId(null)
  }

  async function onDeleteUser(user) {
    if (!window.confirm(t.confirmDeleteUser)) return
    setSavingUserId(user.id)
    const res = await deleteUser(user.id)
    if (!res?.error) {
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setStats(prev => prev ? { ...prev, totalUsers: Math.max(0, (prev.totalUsers || 1) - 1) } : prev)
    }
    setSavingUserId(null)
  }

  async function onDeleteListing(item) {
    if (!window.confirm(t.confirmDeleteListing)) return
    setSavingListingId(item.id)
    const res = await deleteAdminListing(item.id)
    if (!res?.error) {
      setListings(prev => prev.filter(l => l.id !== item.id))
      setStats(prev => prev ? { ...prev, totalListings: Math.max(0, (prev.totalListings || 1) - 1) } : prev)
    }
    setSavingListingId(null)
  }

   async function onSaveListingEdit() {
     if (!editingListing?.id) return
     setSavingListingId(editingListing.id)
     const payload = {
       ...editingListing,
       year: clampListingYear(editingListing.year),
     }
     const res = await updateAdminListing(editingListing.id, payload)
     if (!res?.error) {
       setListings(prev => prev.map(l => l.id === editingListing.id ? normalizeListingYear({ ...l, ...payload }) : l))
       setEditingListing(null)
     }
     setSavingListingId(null)
   }

    function openListingEditor(item) {
      setEditingListing({
        ...item,
        year: clampListingYear(item.year),
        photoUrls: Array.isArray(item.photoUrls) ? [...item.photoUrls] : [],
      })
      setNewPhotoUrl('')
    }

  const filteredListings = useMemo(() => {
    const query = String(listingQuery || '').trim().toLowerCase()
    if (!query) return listings

    return listings.filter((item) => {
      const haystack = [
        cleanListingTitle(item.title),
        item.brand,
        item.model,
        item.description,
        item.city,
        item.ownerUsername,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [listings, listingQuery])

    function updateEditingPhoto(index, value) {
      setEditingListing(prev => {
        if (!prev) return prev
        const nextPhotos = Array.isArray(prev.photoUrls) ? [...prev.photoUrls] : []
        nextPhotos[index] = value
        return { ...prev, photoUrls: nextPhotos }
      })
    }

    function removeEditingPhoto(index) {
      setEditingListing(prev => {
        if (!prev) return prev
        const nextPhotos = (Array.isArray(prev.photoUrls) ? prev.photoUrls : []).filter((_, i) => i !== index)
        return { ...prev, photoUrls: nextPhotos }
      })
    }

    function addEditingPhoto() {
      const trimmed = String(newPhotoUrl || '').trim()
      if (!trimmed) return
      setEditingListing(prev => {
        if (!prev) return prev
        const nextPhotos = [...(Array.isArray(prev.photoUrls) ? prev.photoUrls : [])]
        nextPhotos.push(trimmed)
        return { ...prev, photoUrls: nextPhotos }
      })
      setNewPhotoUrl('')
    }

   async function onSaveFeedback(feedbackId) {
     if (!feedbackId) return
     const res = await markFeedbackAsRead(feedbackId)
     if (!res?.error) {
       setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, isRead: !f.isRead } : f))
     }
   }

   async function onDeleteFeedback(feedbackId) {
     if (!window.confirm(language === 'uk' ? 'Видалити це повідомлення?' : 'Delete this message?')) return
     setSavingListingId(feedbackId)
     const res = await deleteFeedback(feedbackId)
     if (!res?.error) {
       setFeedbacks(prev => prev.filter(f => f.id !== feedbackId))
     }
     setSavingListingId(null)
   }

  if (!canAccess) {
    return (
      <div className={`rounded-3xl border p-8 text-center ${isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`}>
        <h1 className="text-2xl font-bold">{t.forbidden}</h1>
        <Link to="/" className="mt-4 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">
          {t.backHome}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className={`rounded-3xl p-6 shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">{t.eyebrow}</p>
            <h1 className={`mt-2 text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.title}</h1>
            <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">{error}</div>}

      <section className={`space-y-4 rounded-3xl border p-6 shadow-sm ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
        <div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.dashboard}</h2>
        </div>
        {loading ? (
          <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>{t.loading}</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [t.totalUsers, stats?.totalUsers],
              [t.totalListings, stats?.totalListings],
              [t.totalCars, stats?.totalCars],
              [t.totalMotorcycles, stats?.totalMotorcycles],
              [t.avgPrice, formatMoney(stats?.averagePrice)],
              [t.newest7d, stats?.newestListingsCount],
            ].map(([label, value]) => (
              <div key={label} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
                <div className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value ?? 0}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={`space-y-4 rounded-3xl border p-6 shadow-sm ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.users}</h2>
        <div className={`overflow-x-auto rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
          <table className="min-w-full text-sm">
            <thead className={isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}>
              <tr>
                <th className="px-3 py-2 text-left">{t.id}</th>
                <th className="px-3 py-2 text-left">{t.username}</th>
                <th className="px-3 py-2 text-left">{t.email}</th>
                <th className="px-3 py-2 text-left">{t.role}</th>
                <th className="px-3 py-2 text-left">{t.createdAt}</th>
                <th className="px-3 py-2 text-left">{t.listingsCount}</th>
                <th className="px-3 py-2 text-left">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td className="px-3 py-4" colSpan={7}>{t.noData}</td></tr>
              ) : users.map(user => (
                <tr key={user.id} className={isDark ? 'border-t border-slate-700' : 'border-t border-slate-200'}>
                  <td className="px-3 py-2">{user.id}</td>
                  <td className="px-3 py-2">{user.username}</td>
                  <td className="px-3 py-2">{user.email || '—'}</td>
                  <td className="px-3 py-2">{user.role}</td>
                  <td className="px-3 py-2">{formatDate(user.createdAt)}</td>
                  <td className="px-3 py-2">{user.listingsCount ?? 0}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onRoleToggle(user)}
                        disabled={savingUserId === user.id}
                        className="rounded-lg bg-sky-600 px-2 py-1 text-white hover:bg-sky-700 disabled:opacity-70"
                      >
                        {String(user.role).toUpperCase() === 'ADMIN' ? t.makeUser : t.makeAdmin}
                      </button>
                      <button
                        onClick={() => onDeleteUser(user)}
                        disabled={savingUserId === user.id}
                        className="rounded-lg bg-red-600 px-2 py-1 text-white hover:bg-red-700 disabled:opacity-70"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
       </section>

       <section className={`space-y-4 rounded-3xl border p-6 shadow-sm ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
         <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.feedback}</h2>
         <div className="grid gap-3">
           {feedbacks.length === 0 ? (
             <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>{t.noData}</div>
           ) : feedbacks.map(fb => (
             <div key={fb.id} className={`rounded-2xl border p-4 ${fb.isRead ? (isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200') : (isDark ? 'border-sky-600 bg-slate-800' : 'border-sky-300 bg-sky-50')}`}>
               <div className="flex items-start justify-between gap-3">
                 <div className="flex-1">
                   <div className="flex items-center gap-2">
                     <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{fb.name}</p>
                     {!fb.isRead && <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />}
                   </div>
                   <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{fb.email}</p>
                   <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{fb.message}</p>
                   <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{formatDate(fb.createdAt)}</p>
                 </div>
                 <div className="flex flex-col gap-1">
                   <button
                     onClick={() => onSaveFeedback(fb.id)}
                     disabled={savingListingId === fb.id}
                     className={`rounded-lg px-2 py-1 text-xs font-medium text-white transition disabled:opacity-70 ${fb.isRead ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}
                   >
                     {fb.isRead ? t.markUnread : t.markRead}
                   </button>
                   <button
                     onClick={() => onDeleteFeedback(fb.id)}
                     disabled={savingListingId === fb.id}
                     className="rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-70"
                   >
                     {t.delete}
                   </button>
                 </div>
               </div>
             </div>
           ))}
         </div>
       </section>

       <section className={`space-y-4 rounded-3xl border p-6 shadow-sm ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
         <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.listings}</h2>
        <label className="block">
          <span className={`mb-1 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.searchListing}</span>
          <input
            value={listingQuery}
            onChange={(e) => setListingQuery(e.target.value)}
            placeholder={t.searchListingPlaceholder}
            className={`w-full rounded-xl border px-3 py-2 outline-none transition ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-sky-500' : 'border-slate-300 bg-white text-slate-900 focus:border-sky-500'}`}
          />
        </label>
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredListings.length === 0 ? (
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>{t.noData}</div>
          ) : filteredListings.map(item => (
            <article key={item.id} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              {/** Keep raw title in edit form, but show cleaned title in list cards. */}
              {item.photoUrls?.[0] ? (
                <img src={item.photoUrls[0]} alt={cleanListingTitle(item.title)} className="h-40 w-full rounded-xl object-cover" />
              ) : null}
              <h3 className={`mt-3 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{cleanListingTitle(item.title)}</h3>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.brand} {item.model}</p>
              <div className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {t.price}: {formatMoney(item.price)} | {t.year}: {item.year ?? '—'} | {t.mileage}: {item.mileage ?? '—'}
              </div>
              <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {t.vehicleType}: {item.vehicleType || '—'} | {t.owner}: {item.ownerUsername || '—'}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={`/listings/${item.id}`} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">{t.open}</Link>
                <button
                  onClick={() => openListingEditor(item)}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700"
                >
                  {t.edit}
                </button>
                <button
                  onClick={() => onDeleteListing(item)}
                  disabled={savingListingId === item.id}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-70"
                >
                  {t.delete}
                </button>
              </div>
            </article>
          ))}
         </div>
        </section>

        {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl p-5 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
            <h3 className="mb-4 text-lg font-semibold">{t.edit} #{editingListing.id}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={editingListing.title || ''} onChange={e => setEditingListing(prev => ({ ...prev, title: e.target.value }))} placeholder={t.titleCol} className="rounded-lg border px-3 py-2 text-slate-900" />
              <input value={editingListing.price ?? ''} onChange={e => setEditingListing(prev => ({ ...prev, price: Number(e.target.value) || 0 }))} placeholder={t.price} className="rounded-lg border px-3 py-2 text-slate-900" />
              <input value={editingListing.brand || ''} onChange={e => setEditingListing(prev => ({ ...prev, brand: e.target.value }))} placeholder={t.brand} className="rounded-lg border px-3 py-2 text-slate-900" />
              <input value={editingListing.model || ''} onChange={e => setEditingListing(prev => ({ ...prev, model: e.target.value }))} placeholder={t.model} className="rounded-lg border px-3 py-2 text-slate-900" />
              <input value={editingListing.year ?? ''} onChange={e => setEditingListing(prev => ({ ...prev, year: clampListingYear(e.target.value) }))} placeholder={t.year} max={MAX_PRODUCTION_YEAR} type="number" className="rounded-lg border px-3 py-2 text-slate-900" />
              <input value={editingListing.mileage ?? ''} onChange={e => setEditingListing(prev => ({ ...prev, mileage: Number(e.target.value) || null }))} placeholder={t.mileage} className="rounded-lg border px-3 py-2 text-slate-900" />
              <input value={editingListing.vehicleType || ''} onChange={e => setEditingListing(prev => ({ ...prev, vehicleType: e.target.value }))} placeholder={t.vehicleType} className="rounded-lg border px-3 py-2 text-slate-900" />
              <input value={editingListing.ownerUsername || ''} onChange={e => setEditingListing(prev => ({ ...prev, ownerUsername: e.target.value }))} placeholder={t.owner} className="rounded-lg border px-3 py-2 text-slate-900" />
              <textarea value={editingListing.description || ''} onChange={e => setEditingListing(prev => ({ ...prev, description: e.target.value }))} placeholder="Description" className="rounded-lg border px-3 py-2 text-slate-900 sm:col-span-2" rows={4} />
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-sm font-semibold">{t.photos}</div>

              {!Array.isArray(editingListing.photoUrls) || editingListing.photoUrls.length === 0 ? (
                <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t.noPhotos}</div>
              ) : (
                <div className="space-y-2">
                  {editingListing.photoUrls.map((url, index) => (
                    <div key={`${index}-${url}`} className="grid gap-2 sm:grid-cols-[96px_1fr_auto] sm:items-center">
                      <img
                        src={url}
                        alt={`photo-${index + 1}`}
                        className="h-16 w-24 rounded-lg object-cover border"
                        onError={(e) => { e.currentTarget.style.opacity = '0.4' }}
                      />
                      <input
                        value={url}
                        onChange={e => updateEditingPhoto(index, e.target.value)}
                        placeholder={t.photoUrlPlaceholder}
                        className="rounded-lg border px-3 py-2 text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => removeEditingPhoto(index)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                      >
                        {t.removePhoto}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={newPhotoUrl}
                  onChange={e => setNewPhotoUrl(e.target.value)}
                  placeholder={t.photoUrlPlaceholder}
                  className="rounded-lg border px-3 py-2 text-slate-900"
                />
                <button
                  type="button"
                  onClick={addEditingPhoto}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
                >
                  {t.addPhoto}
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={onSaveListingEdit} disabled={savingListingId === editingListing.id} className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-70">{t.save}</button>
              <button onClick={() => { setEditingListing(null); setNewPhotoUrl('') }} className="rounded-lg border px-4 py-2">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


