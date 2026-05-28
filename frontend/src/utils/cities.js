export const CITY_OPTIONS_UK = [
  'Київ',
  'Львів',
  'Одеса',
  'Харків',
  'Дніпро',
  'Вінниця',
  'Івано-Франківськ',
  'Тернопіль',
  'Полтава',
  'Черкаси',
  'Рівне',
  'Запоріжжя',
]

export const CITY_UK_TO_EN = {
  'Київ': 'Kyiv',
  'Львів': 'Lviv',
  'Одеса': 'Odesa',
  'Харків': 'Kharkiv',
  'Дніпро': 'Dnipro',
  'Вінниця': 'Vinnytsia',
  'Івано-Франківськ': 'Ivano-Frankivsk',
  'Тернопіль': 'Ternopil',
  'Полтава': 'Poltava',
  'Черкаси': 'Cherkasy',
  'Рівне': 'Rivne',
  'Запоріжжя': 'Zaporizhzhia',
}

export const CITY_EN_TO_UK = Object.fromEntries(
  Object.entries(CITY_UK_TO_EN).map(([uk, en]) => [en, uk])
)

export function toCanonicalCity(city) {
  if (!city) return city
  const value = String(city).trim()
  return CITY_EN_TO_UK[value] || value
}

export function translateCity(city, language) {
  const canonical = toCanonicalCity(city)
  if (!canonical) return canonical
  if (language === 'uk') return canonical
  return CITY_UK_TO_EN[canonical] || canonical
}

