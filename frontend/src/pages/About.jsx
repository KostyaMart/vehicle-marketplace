import React, { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import { LanguageContext } from '../context/LanguageContext'

const translations = {
  uk: {
    title: 'Про нас',
    subtitle: 'Про маркетплейс DrivePoint',
    intro: 'DrivePoint — це інноваційний онлайн маркетплейс для продажу та покупки автомобілів і мотоциклів. Ми спрощуємо процес пошуку ідеального транспорту для вас.',
    mission: 'Наша місія',
    missionText: 'Ми вірим, що кожен має право отримати доступ до якісного велосипеда, машини чи мотоцикла по справедливій ціні. DrivePoint скорочує дистанцію між продавцями та покупцями, забезпечуючи прозорість та безпеку.',
    features: 'Що нас відрізняє',
    feature1: 'Велика база об\'явлень',
    feature1Desc: 'Тисячі автомобілів та мотоциклів на вибір з детальною інформацією та фото',
    feature2: 'Ефективний пошук',
    feature2Desc: 'Розширені фільтри допоможуть знайти транспорт за вашими критеріями за кілька кліків',
    feature3: 'Рекомендації',
    feature3Desc: 'Система рекомендацій на основі ваших переглядів та пошуків показує вам найкращі варіанти',
    feature4: 'Безпечність',
    feature4Desc: 'Надійна система захисту даних та аутентифікація для вашої безпеки',
    contact: 'Зв\'яжіться з нами',
    email: 'support@drivepoint.ua',
  },
  en: {
    title: 'About Us',
    subtitle: 'About DrivePoint Marketplace',
    intro: 'DrivePoint is an innovative online marketplace for buying and selling cars and motorcycles. We simplify the process of finding the perfect vehicle for you.',
    mission: 'Our Mission',
    missionText: 'We believe everyone deserves access to a quality car or motorcycle at a fair price. DrivePoint bridges the gap between sellers and buyers, ensuring transparency and safety.',
    features: 'What Makes Us Different',
    feature1: 'Large Database of Listings',
    feature1Desc: 'Thousands of cars and motorcycles to choose from with detailed information and photos',
    feature2: 'Efficient Search',
    feature2Desc: 'Advanced filters help you find the perfect vehicle for your needs in just a few clicks',
    feature3: 'Recommendations',
    feature3Desc: 'A recommendation system based on your views and searches shows you the best options',
    feature4: 'Security',
    feature4Desc: 'Reliable data protection system and authentication for your safety',
    contact: 'Get In Touch',
    email: 'support@drivepoint.ua',
  }
}

export default function About() {
  const { isDark } = useContext(ThemeContext)
  const { language } = useContext(LanguageContext)
  const t = translations[language] || translations['uk']

  return (
    <div className="space-y-8">
      <section className={`rounded-3xl p-8 sm:p-12 ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-700' : 'bg-gradient-to-br from-slate-100 to-slate-50'}`}>
        <h1 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {t.title}
        </h1>
        <h2 className={`mt-2 text-lg sm:text-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {t.subtitle}
        </h2>
      </section>

      <section className="space-y-6">
        <div className={`rounded-3xl border p-8 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
          <p className={`text-base leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {t.intro}
          </p>
        </div>

        <div className={`rounded-3xl border p-8 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
          <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t.mission}
          </h3>
          <p className={`text-base leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {t.missionText}
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {t.features}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.feature1}
            </h4>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.feature1Desc}
            </p>
          </div>
          <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.feature2}
            </h4>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.feature2Desc}
            </p>
          </div>
          <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.feature3}
            </h4>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.feature3Desc}
            </p>
          </div>
          <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.feature4}
            </h4>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.feature4Desc}
            </p>
          </div>
        </div>
      </section>

      <section className={`rounded-3xl border p-8 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
        <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {t.contact}
        </h3>
        <p className={`text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {t.email}
        </p>
      </section>
    </div>
  )
}

