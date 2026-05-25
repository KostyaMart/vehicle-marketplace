// Canonical values stored in DB are Ukrainian.
// This map translates them to English for the EN locale.

export const VALUE_MAP = {
  // fuelType
  'Бензин':    { en: 'Gasoline' },
  'Дизель':    { en: 'Diesel' },
  'Газ (LPG)': { en: 'Gas (LPG)' },
  'Газ (CNG)': { en: 'Gas (CNG)' },
  'Гібрид':    { en: 'Hybrid' },
  'Електро':   { en: 'Electric' },
  // transmission
  'Механіка':  { en: 'Manual' },
  'Автомат':   { en: 'Automatic' },
  'Варіатор':  { en: 'CVT' },
  'Робот':     { en: 'Robot' },
  // bodyType — cars
  'Седан':        { en: 'Sedan' },
  'Універсал':    { en: 'Wagon' },
  'Хетчбек':      { en: 'Hatchback' },
  'Кросовер':     { en: 'Crossover' },
  'Позашляховик': { en: 'SUV' },
  'Мікровен':     { en: 'Minivan' },
  'Купе':         { en: 'Coupe' },
  'Кабріолет':    { en: 'Convertible' },
  // bodyType — motos
  'Спортбайк':    { en: 'Sportbike' },
  'Туристичний':  { en: 'Touring' },
  'Круізер':      { en: 'Cruiser' },
  'Ендуро':       { en: 'Enduro' },
  'Кросовий':     { en: 'Motocross' },
  'Мопед/Скутер': { en: 'Moped/Scooter' },
  'Нейкед':       { en: 'Naked' },
  // driveType
  'Передній': { en: 'FWD' },
  'Задній':   { en: 'RWD' },
  'Повний':   { en: 'AWD' },
  // condition
  'Відмінний':       { en: 'Excellent' },
  'Хороший':         { en: 'Good' },
  'Задовільний':     { en: 'Satisfactory' },
  'Требує ремонту':  { en: 'Needs repair' },
  // colors
  'Чорний':      { en: 'Black' },
  'Білий':       { en: 'White' },
  'Сірий':       { en: 'Gray' },
  'Сріблистий':  { en: 'Silver' },
  'Червоний':    { en: 'Red' },
  'Синій':       { en: 'Blue' },
  'Блакитний':   { en: 'Light Blue' },
  'Зелений':     { en: 'Green' },
  'Жовтий':      { en: 'Yellow' },
  'Коричневий':  { en: 'Brown' },
  'Помаранчевий':{ en: 'Orange' },
  'Золотий':     { en: 'Gold' },
  'Бежевий':     { en: 'Beige' },
  'Бордовий':    { en: 'Burgundy' },
}

// Legacy / EN aliases that may already exist in DB.
const EN_TO_UK_ALIASES = {
  Gasoline: 'Бензин',
  Petrol: 'Бензин',
  Diesel: 'Дизель',
  'Gas (LPG)': 'Газ (LPG)',
  'Gas (CNG)': 'Газ (CNG)',
  Hybrid: 'Гібрид',
  Electric: 'Електро',
  Manual: 'Механіка',
  Automatic: 'Автомат',
  CVT: 'Варіатор',
  Robot: 'Робот',
  Sedan: 'Седан',
  Wagon: 'Універсал',
  Hatchback: 'Хетчбек',
  Crossover: 'Кросовер',
  SUV: 'Позашляховик',
  Minivan: 'Мікровен',
  Coupe: 'Купе',
  Convertible: 'Кабріолет',
  Sportbike: 'Спортбайк',
  Touring: 'Туристичний',
  Cruiser: 'Круізер',
  Enduro: 'Ендуро',
  Motocross: 'Кросовий',
  'Moped/Scooter': 'Мопед/Скутер',
  Naked: 'Нейкед',
  FWD: 'Передній',
  RWD: 'Задній',
  AWD: 'Повний',
  Excellent: 'Відмінний',
  Good: 'Хороший',
  Satisfactory: 'Задовільний',
  Fair: 'Задовільний',
  'Needs repair': 'Требує ремонту',
  Black: 'Чорний',
  White: 'Білий',
  Gray: 'Сірий',
  Grey: 'Сірий',
  Silver: 'Сріблистий',
  Red: 'Червоний',
  Blue: 'Синій',
  Green: 'Зелений',
  Yellow: 'Жовтий',
  Brown: 'Коричневий',
  Orange: 'Помаранчевий',
  Gold: 'Золотий',
  Beige: 'Бежевий',
  Burgundy: 'Бордовий',
}

const DESCRIPTION_LABELS = {
  uk: {
    'Fuel:': 'Паливо:',
    'Transmission:': 'КПП:',
    'Gearbox:': 'КПП:',
    'Body:': 'Кузов:',
    'Drive:': 'Привід:',
    'Condition:': 'Стан:',
    'Owners:': 'Власників:',
    'Engine:': "Об'єм:",
  },
  en: {
    'Паливо:': 'Fuel:',
    'КПП:': 'Transmission:',
    'Кузов:': 'Body:',
    'Привід:': 'Drive:',
    'Стан:': 'Condition:',
    'Власників:': 'Owners:',
    "Об'єм:": 'Engine:',
  },
}

/**
 * Returns the translated value for the given locale.
 * Falls back to the original value if no translation found (e.g. proper nouns / cities).
 */
export function translateValue(value, language) {
  if (!value) return value
  const canonical = toCanonicalValue(value)
  if (language === 'uk') return canonical
  return VALUE_MAP[String(canonical)]?.[language] ?? canonical
}

export function toCanonicalValue(value) {
  if (!value) return value
  const raw = String(value).trim()
  if (VALUE_MAP[raw]) return raw
  return EN_TO_UK_ALIASES[raw] ?? raw
}

export function translateDescription(description, language) {
  if (!description) return description
  let text = String(description)

  const labels = DESCRIPTION_LABELS[language] || {}
  Object.entries(labels).forEach(([from, to]) => {
    text = text.split(from).join(to)
  })

  // Convert any legacy EN values into canonical UK first.
  Object.entries(EN_TO_UK_ALIASES).forEach(([enValue, ukValue]) => {
    text = text.split(enValue).join(ukValue)
  })

  // Then translate to current UI language.
  if (language !== 'uk') {
    Object.entries(VALUE_MAP).forEach(([ukValue, locales]) => {
      const target = locales?.[language]
      if (target) text = text.split(ukValue).join(target)
    })
  }

  return text
}

