import React from 'react'
import { useEffect, useState, useContext } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Register from './pages/Register'
import Listings from './pages/Listings'
import ListingDetails from './pages/ListingDetails'
import Recommendations from './pages/Recommendations'
import CreateListing from './pages/CreateListing'
import Profile from './pages/Profile'
import EditListing from './pages/EditListing'
import About from './pages/About'
import Contacts from './pages/Contacts'
import Terms from './pages/Terms'
import { getToken, getUsernameFromToken, logout } from './api/auth'
import { ThemeProvider, ThemeContext } from './context/ThemeContext'
import { LanguageProvider, LanguageContext } from './context/LanguageContext'
import './index.css'

function useAuthState() {
  const [token, setToken] = useState(() => getToken())

  useEffect(() => {
	const sync = () => setToken(getToken())
	window.addEventListener('auth-change', sync)
	window.addEventListener('storage', sync)
	return () => {
	  window.removeEventListener('auth-change', sync)
	  window.removeEventListener('storage', sync)
	}
  }, [])

  return {
	token,
	username: getUsernameFromToken(token),
	isAuthenticated: Boolean(token),
  }
}

function Shell({ children }) {
  const auth = useAuthState()
  const { isDark, toggleTheme } = useContext(ThemeContext)
  const { language, switchLanguage } = useContext(LanguageContext)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navLinkClass = ({ isActive }) =>
	[
	  'rounded-full px-4 py-2 text-sm font-medium transition',
	  isActive
	    ? isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'
	    : isDark ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
	].join(' ')

  const translations = {
    uk: {
      home: 'Головна',
      catalog: 'Каталог',
      recommendations: 'Рекомендації',
      create: 'Створити',
      login: 'Увійти',
      register: 'Реєстрація',
      logout: 'Вийти',
      guest: 'Гість',
      loggedIn: 'Вхід виконано',
      notLoggedIn: 'Вхід не виконано',
      profile: 'Особистий кабінет',
    },
    en: {
      home: 'Home',
      catalog: 'Catalog',
      recommendations: 'Recommendations',
      create: 'Create',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      guest: 'Guest',
      loggedIn: 'Logged in',
      notLoggedIn: 'Not logged in',
      profile: 'Profile',
    },
  }

  const t = translations[language] || translations['uk']

  return (
	<div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
	  <header className={`sticky top-0 z-20 transition-colors ${isDark ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-white/90'} border-b backdrop-blur`}>
		<div className={`mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4 px-4 py-4 sm:px-6 lg:px-8 flex-wrap`}>
		  <Link to="/" className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
			  DrivePoint
		  </Link>

		  <nav className="flex flex-wrap items-center gap-1 sm:gap-2 order-3 sm:order-2 w-full sm:w-auto">
			<NavLink to="/" className={navLinkClass}>{t.home}</NavLink>
			<NavLink to="/listings" className={navLinkClass}>{t.catalog}</NavLink>
			<NavLink to="/recommendations" className={navLinkClass}>{t.recommendations}</NavLink>
			<NavLink to="/create" className={navLinkClass}>{t.create}</NavLink>
		  </nav>

		  <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-3 ml-auto sm:ml-0">

			{/* Языковой переключатель */}
			<div className="relative">
			  <button
				onClick={() => setShowLangMenu(!showLangMenu)}
				className={`rounded-full px-3 py-2 text-sm font-medium transition ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'}`}
			  >
				{language.toUpperCase()}
			  </button>
			  {showLangMenu && (
				<div className={`absolute right-0 mt-2 rounded-lg shadow-lg z-50 ${isDark ? 'bg-slate-700' : 'bg-white'} border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}>
				  {['uk', 'en'].map(lang => (
					<button
					  key={lang}
					  onClick={() => { switchLanguage(lang); setShowLangMenu(false); }}
					  className={`block w-full text-left px-4 py-2 text-sm transition ${language === lang ? (isDark ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-900') : (isDark ? 'text-white hover:bg-slate-600' : 'text-slate-900 hover:bg-slate-100')}`}
					>
					  {lang === 'uk' ? 'Українська' : 'English'}
					</button>
				  ))}
				</div>
			  )}
			</div>

			{/* Переключатель темы */}
			<button
			  onClick={toggleTheme}
			  className={`rounded-full p-2 transition ${isDark ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
			  aria-label="Toggle theme"
			>
			  {isDark ? '☀️' : '🌙'}
			</button>

			{/* Профиль пользователя или кнопки входа */}
			{auth.isAuthenticated ? (
			  <div
				className="relative"
				onMouseEnter={() => setShowUserMenu(true)}
				onMouseLeave={() => setShowUserMenu(false)}
			  >
				<button
				  type="button"
				  className={`rounded-full px-3 py-2 text-sm cursor-pointer transition font-medium ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'}`}
				>
				  {auth.username}
				</button>
				{showUserMenu && (
				  <div className="absolute right-0 top-full pt-2 z-50 min-w-48">
					<div className={`rounded-lg shadow-lg ${isDark ? 'bg-slate-700' : 'bg-white'} border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}>
					  <Link to="/profile" className={`block w-full text-left px-4 py-2 text-sm transition ${isDark ? 'text-white hover:bg-slate-600' : 'text-slate-900 hover:bg-slate-100'}`}>
						{language === 'uk' ? 'Особистий кабінет' : 'Profile'}
					  </Link>
					  <button
						onClick={logout}
						className={`block w-full text-left px-4 py-2 text-sm transition ${isDark ? 'text-white hover:bg-slate-600' : 'text-slate-900 hover:bg-slate-100'}`}
					  >
						{t.logout}
					  </button>
					</div>
				  </div>
				)}
			  </div>
			) : (
			  <>
				<NavLink to="/login" className={navLinkClass}>{t.login}</NavLink>
				<NavLink to="/register" className={navLinkClass}>{t.register}</NavLink>
			  </>
			)}
		  </div>
		</div>
	  </header>

	  <main className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 transition-colors`}>{children}</main>
	</div>
  )
}

const RootApp = () => (
  <ThemeProvider>
    <LanguageProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/:id" element={<ListingDetails />} />
            <Route path="/listings/:id/edit" element={<EditListing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/create" element={<CreateListing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </LanguageProvider>
  </ThemeProvider>
)

const root = document.getElementById('root')
if (root) createRoot(root).render(<RootApp />)






