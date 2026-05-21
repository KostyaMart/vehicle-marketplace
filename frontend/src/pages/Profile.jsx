import React, { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getToken, getUsernameFromToken, getCurrentUsername, getFavorites, toggleFavoriteItem, changePassword } from '../api/auth'
import { ThemeContext } from '../context/ThemeContext'
import { LanguageContext } from '../context/LanguageContext'
import { getListings, deleteListing } from '../api/listings'

const translations = {
  uk: {
    profile: 'Особистий кабінет',
    about: 'Про себе',
    favorites: 'Улюблені',
    firstName: 'Ім\'я',
    lastName: 'Прізвище',
    email: 'Електронна пошта',
    phone: 'Телефон',
    changePassword: 'Змінити пароль',
    oldPassword: 'Старий пароль',
    newPassword: 'Новий пароль',
    confirmPassword: 'Підтвердити пароль',
    save: 'Зберегти',
    saving: 'Збереження...',
    noFavorites: 'У вас ще немає улюблених оголошень',
    myListings: 'Мої оголошення',
    noMyListings: 'У вас ще немає власних оголошень',
    edit: 'Редагувати',
    delete: 'Видалити',
    deletingListing: 'Видалення...',
    deleteConfirm: 'Ви впевнені, що хочете видалити це об\'яву?',
  },
  en: {
    profile: 'Profile',
    about: 'About',
    favorites: 'Favorites',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    changePassword: 'Change Password',
    oldPassword: 'Old Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    save: 'Save',
    saving: 'Saving...',
    noFavorites: 'You have no favorite listings yet',
    myListings: 'My Listings',
    noMyListings: 'You have no own listings yet',
    edit: 'Edit',
    delete: 'Delete',
    deletingListing: 'Deleting...',
    deleteConfirm: 'Are you sure you want to delete this listing?',
  }
}

export default function Profile() {
  const { isDark } = useContext(ThemeContext)
  const { language } = useContext(LanguageContext)
  const navigate = useNavigate()
  const t = translations[language] || translations['uk']

  const [activeTab, setActiveTab] = useState('about')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [favorites, setFavorites] = useState([])
  const [myListings, setMyListings] = useState([])

  // Check authentication
  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    const username = getCurrentUsername() || getUsernameFromToken(token) || ''

    // Load user data from per-user localStorage key
    const userData = JSON.parse(localStorage.getItem(`userData:${username}`) || '{}')
    setFormData({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      phone: userData.phone || '',
    })

    // Load favorites for current user
    const userFavorites = getFavorites()
    setFavorites(userFavorites)

    const myIds = JSON.parse(localStorage.getItem(`myListingIds:${username}`) || '[]').map((id) => String(id))
    getListings().then((data) => {
      if (Array.isArray(data)) {
        setMyListings(data.filter((item) => myIds.includes(String(item.id))))
      }
    })
  }, [navigate])

  useEffect(() => {
    function onFav() {
      setFavorites(getFavorites())
    }
    window.addEventListener('favorites-updated', onFav)
    return () => window.removeEventListener('favorites-updated', onFav)
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Save to per-user localStorage (in production, would be API call)
      const username = getCurrentUsername() || getUsernameFromToken(getToken()) || ''
      localStorage.setItem(`userData:${username}`, JSON.stringify(formData))
      setMessage(language === 'uk' ? 'Профіль збережено' : 'Profile saved')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(language === 'uk' ? 'Помилка збереження' : 'Error saving profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage(language === 'uk' ? 'Паролі не збігаються' : 'Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const res = await changePassword(passwordData.oldPassword, passwordData.newPassword)
      if (res?.error) {
        setMessage(res.error)
      } else {
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
        setMessage(language === 'uk' ? 'Пароль змінено' : 'Password changed')
      }
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(language === 'uk' ? 'Помилка при зміні пароля' : 'Error changing password')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm(t.deleteConfirm)) return

    setDeletingId(listingId)
    try {
      const res = await deleteListing(listingId)
      if (res?.error) {
        setMessage(res.error)
      } else {
        setMessage(language === 'uk' ? 'Об\'яву видалено' : 'Listing deleted')
        // Перезагрузить список объявлений
        const username = getCurrentUsername() || getUsernameFromToken(getToken()) || ''
        const myIds = JSON.parse(localStorage.getItem(`myListingIds:${username}`) || '[]')
        const filtered = myIds.filter((id) => String(id) !== String(listingId))
        localStorage.setItem(`myListingIds:${username}`, JSON.stringify(filtered))
        
        // Обновить состояние
        setMyListings(prev => prev.filter((item) => String(item.id) !== String(listingId)))
      }
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(language === 'uk' ? 'Помилка при видаленні об\'яви' : 'Error deleting listing')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={`space-y-6 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      <div>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {t.profile}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: isDark ? '#374151' : '#e2e8f0' }}>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-3 font-medium text-sm transition ${
            activeTab === 'about'
              ? isDark ? 'border-b-2 border-sky-600 text-sky-400' : 'border-b-2 border-sky-600 text-sky-600'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.about}
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-3 font-medium text-sm transition ${
            activeTab === 'favorites'
              ? isDark ? 'border-b-2 border-sky-600 text-sky-400' : 'border-b-2 border-sky-600 text-sky-600'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.favorites}
        </button>
        <button
          onClick={() => setActiveTab('myListings')}
          className={`px-4 py-3 font-medium text-sm transition ${
            activeTab === 'myListings'
              ? isDark ? 'border-b-2 border-sky-600 text-sky-400' : 'border-b-2 border-sky-600 text-sky-600'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.myListings}
        </button>
      </div>

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className={`rounded-3xl border p-8 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {t.firstName}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`rounded-xl px-4 py-3 outline-none transition ${
                    isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {t.lastName}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`rounded-xl px-4 py-3 outline-none transition ${
                    isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {t.email}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`rounded-xl px-4 py-3 outline-none transition ${
                    isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {t.phone}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`rounded-xl px-4 py-3 outline-none transition ${
                    isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'
                  }`}
                />
              </div>
            </div>

            <div className="border-t" style={{ borderColor: isDark ? '#374151' : '#e2e8f0' }}>
              <h3 className={`mt-6 mb-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t.changePassword}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 sm:col-span-1">
                  <label className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {t.oldPassword}
                  </label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    className={`rounded-xl px-4 py-3 outline-none transition ${
                      isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {t.newPassword}
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={`rounded-xl px-4 py-3 outline-none transition ${
                      isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {t.confirmPassword}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`rounded-xl px-4 py-3 outline-none transition ${
                      isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'
                    }`}
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-70 disabled:cursor-not-allowed w-full"
                  >
                    {loading ? t.saving : t.changePassword}
                  </button>
                </div>
              </div>
            </div>

            {message && (
              <div className={`rounded-xl px-4 py-3 text-sm ${
                message.includes('Помилка') || message.includes('Error')
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? t.saving : t.save}
            </button>
          </form>
        </div>
      )}

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div className={`rounded-3xl border p-8 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
          {favorites.length === 0 ? (
            <p className={`text-center text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {t.noFavorites}
            </p>
          ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {favorites.map(item => (
                      <div key={item.id} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <Link to={`/listings/${item.id}`} className="flex-1">
                            {item.photoUrls && item.photoUrls[0] && (
                              <img src={item.photoUrls[0]} alt={item.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                            )}
                            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {item.title}
                            </h3>
                            <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {item.brand} {item.model}
                            </p>
                            <p className={`text-sm font-bold mt-2 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                              ${item.price}
                            </p>
                          </Link>
                          <div>
                            <button onClick={() => { const next = toggleFavoriteItem(item); setFavorites(getFavorites()); }} className={`rounded-full p-2 ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{'❤️'}</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
          )}
        </div>
      )}

       {activeTab === 'myListings' && (
         <div className={`rounded-3xl border p-8 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
           {myListings.length === 0 ? (
             <p className={`text-center text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
               {t.noMyListings}
             </p>
           ) : (
             <div className="grid gap-4 md:grid-cols-2">
               {myListings.map((item) => (
                 <div key={item.id} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
                   {item.photoUrls && item.photoUrls[0] && (
                     <img src={item.photoUrls[0]} alt={item.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                   )}
                   <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                     {item.title}
                   </h3>
                   <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                     {item.brand} {item.model}
                   </p>
                   <div className="mt-3 flex items-center justify-between gap-2">
                     <p className={`text-sm font-bold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                       ${item.price}
                     </p>
                     <div className="flex gap-2">
                       <Link to={`/listings/${item.id}/edit`} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 transition">
                         {t.edit}
                       </Link>
                       <button
                         onClick={() => handleDeleteListing(item.id)}
                         disabled={deletingId === item.id}
                         className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition disabled:opacity-70"
                       >
                         {deletingId === item.id ? t.deletingListing : t.delete}
                       </button>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       )}
    </div>
  )
}



