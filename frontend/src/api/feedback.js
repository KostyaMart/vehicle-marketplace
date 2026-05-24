const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'

async function requestJson(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { error: data.error || data.message || `Запит не вдався зі статусом ${res.status}` }
  }
  return data
}

export function sendFeedback(feedback) {
  return requestJson(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback),
  })
}

export function getFeedbacks() {
  return requestJson(`${API_BASE}/feedback`, {
    headers: { 'Content-Type': 'application/json' },
  })
}

