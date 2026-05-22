const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'
const AUTH_EVENT = 'auth-change'

function emitAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT))
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '='))
    return JSON.parse(json)
  } catch {
    return null
  }
}

async function requestJson(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { error: data.error || `Запит не вдався зі статусом ${res.status}` }
  }
  return data
}

export async function login(username, password) {
  return requestJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

// register expects an object with fields: username, password, email, phone, firstName, lastName
export async function register(payload) {
  return requestJson(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function saveToken(token) {
  localStorage.setItem('jwt', token)
  const username = getUsernameFromToken(token)
  if (username) localStorage.setItem('currentUsername', username)
  emitAuthChange()
}

export function getToken() {
  return localStorage.getItem('jwt')
}

export function getUsernameFromToken(token = getToken()) {
  if (!token) return null
  return decodeJwtPayload(token)?.sub || null
}

export function authHeader() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function logout() {
  localStorage.removeItem('jwt')
  localStorage.removeItem('currentUsername')
  emitAuthChange()
}

export function getCurrentUsername() {
  // Prefer explicitly stored currentUsername, otherwise try to decode token
  const fromStorage = localStorage.getItem('currentUsername')
  if (fromStorage) return fromStorage
  return getUsernameFromToken() || null
}

export function getFavoritesKey() {
  const username = getCurrentUsername()
  return username ? `favorites:${username}` : 'favorites'
}

export function getFavorites() {
  return JSON.parse(localStorage.getItem(getFavoritesKey()) || '[]')
}

export function setFavorites(arr) {
  localStorage.setItem(getFavoritesKey(), JSON.stringify(arr))
  window.dispatchEvent(new Event('favorites-updated'))
}

export function toggleFavoriteItem(item) {
  const favorites = getFavorites()
  const exists = favorites.some((f) => f.id === item.id)
  const next = exists ? favorites.filter((f) => f.id !== item.id) : [...favorites, item]
  setFavorites(next)
  return !exists
}

export async function changePassword(oldPassword, newPassword) {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ oldPassword, newPassword }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { error: data.error || `Request failed with status ${res.status}` }
  return data
}

