import { authHeader } from './auth'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'

async function requestJson(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { error: data.error || data.message || `Запит не вдався зі статусом ${res.status}` }
  }
  return data
}

export function getAdminStats() {
  return requestJson(`${API_BASE}/admin/stats`, {
    headers: { ...authHeader() },
  })
}

export function getAdminUsers() {
  return requestJson(`${API_BASE}/admin/users`, {
    headers: { ...authHeader() },
  })
}

export function updateUserRole(id, role) {
  return requestJson(`${API_BASE}/admin/users/${id}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ role }),
  })
}

export function deleteUser(id) {
  return requestJson(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
    headers: { ...authHeader() },
  })
}

export function getAdminListings() {
  return requestJson(`${API_BASE}/admin/listings`, {
    headers: { ...authHeader() },
  })
}

export function updateAdminListing(id, payload) {
  return requestJson(`${API_BASE}/admin/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  })
}

export function deleteAdminListing(id) {
  return requestJson(`${API_BASE}/admin/listings/${id}`, {
    method: 'DELETE',
    headers: { ...authHeader() },
  })
}

export function getFeedbacks() {
  return requestJson(`${API_BASE}/feedback`, {
    headers: { ...authHeader() },
  })
}

export function markFeedbackAsRead(id) {
  return requestJson(`${API_BASE}/feedback/${id}/read`, {
    method: 'PUT',
    headers: { ...authHeader() },
  })
}

export function deleteFeedback(id) {
  return requestJson(`${API_BASE}/feedback/${id}`, {
    method: 'DELETE',
    headers: { ...authHeader() },
  })
}

