const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'

export async function getVehicleAiRecommendations(payload) {
  const res = await fetch(`${API_BASE}/assistant/vehicle-recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { error: data.message || data.error || `Запит не вдався зі статусом ${res.status}` }
  }

  return data
}

