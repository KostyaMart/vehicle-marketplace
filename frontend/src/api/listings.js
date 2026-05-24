import { authHeader } from './auth'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'

async function requestJson(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { error: data.error || `Запит не вдався зі статусом ${res.status}` }
  }
  return data
}

export async function getListings() {
  return requestJson(`${API_BASE}/listings`)
}

export async function getPublicStats() {
  return requestJson(`${API_BASE}/public/stats`)
}

export async function getListing(id) {
  return requestJson(`${API_BASE}/listings/${id}`)
}

export async function getRecommendations(params = {}) {
  const query = new URLSearchParams(params).toString()
  return requestJson(`${API_BASE}/listings/recommend?${query}`)
}

export async function createListing(listing) {
  const photos = Array.isArray(listing?.photos) ? listing.photos : []
  if (photos.length > 0) {
    const formData = new FormData()
    const { photos: _ignored, ...payload } = listing
    formData.append('listing', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
    photos.forEach((photo) => formData.append('photos', photo))

    return requestJson(`${API_BASE}/listings`, {
      method: 'POST',
      headers: { ...authHeader() },
      body: formData,
    })
  }

  const { photos: _ignored, ...payload } = listing
  return requestJson(`${API_BASE}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  })
}

export async function updateListing(id, listing) {
  return requestJson(`${API_BASE}/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(listing),
  })
}

export async function deleteListing(id) {
  const res = await fetch(`${API_BASE}/listings/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return { error: data.error || `Запит не вдався зі статусом ${res.status}` }
  }
  return { success: true }
}



