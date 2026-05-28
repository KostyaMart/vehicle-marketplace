const TITLE_TRIMS = new Set([
  'base', 'street', 'touring', 'sport', 'naked', 'enduro', 'urban', 'adventure', 'track', 'comfort',
  'long ride', 'city', 'race', 'classic', 'pro', 'rally', 'grand tour', 'light', 'daily', 'premium',
  'база', 'style', 'tour', 'tech', 'eco', 'family', 'business', 'plus', 'max', 'elite', 'turbo', 'smart', 'performance',
])

export function cleanListingTitle(title) {
  const value = String(title || '').trim()
  if (!value) return value

  const splitIndex = value.lastIndexOf(' · ')
  if (splitIndex < 0) return value

  const suffix = value.slice(splitIndex + 3).trim().toLowerCase()
  if (TITLE_TRIMS.has(suffix)) {
    return value.slice(0, splitIndex).trim()
  }

  return value
}
