import React, { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import { LanguageContext } from '../context/LanguageContext'

const translations = {
  uk: {
    title: 'Умови використання',
    subtitle: 'Умови обслуговування DrivePoint',
    lastUpdated: 'Останнє оновлення',
    section1: 'Прийняття системи',
    section1Text: 'Використовуючи наш маркетплейс, ви погоджуєтесь з цими умовами обслуговування. Якщо ви не згодні, будь ласка, не використовуйте нашу платформу.',
    section2: 'Концепція та використання',
    section2Text: 'DrivePoint є платформою для купівлі та продажу автомобілів і мотоциклів. Користувачі несуть повну відповідальність за точність повідомлену інформацію.',
    section3: 'Реєстрація облікового запису',
    section3Text: 'Для використання певних функцій платформи ви повинні създать обліковий запис. Ви несете відповідальність за його безпеку.',
    section4: 'Наслідки',
    section4Text: 'DrivePoint не несе жодної відповідальності за непрямі, випадкові або наслідки втрат.',
    section5: 'Технічна поддержка',
    section5Text: 'Ми закладемо всьому, щоб платформа була стабільною та безпечною, але не можемо гарантувати безперервної роботи.',
    accept: 'Я прочитав та приймаю Умови використання',
  },
  en: {
    title: 'Terms of Service',
    subtitle: 'DrivePoint Terms and Conditions',
    lastUpdated: 'Last Updated',
    section1: 'Acceptance of Terms',
    section1Text: 'By using our marketplace, you agree to these terms of service. If you do not agree, please do not use our platform.',
    section2: 'Description and Use',
    section2Text: 'DrivePoint is a platform for buying and selling cars and motorcycles. Users are responsible for the accuracy of information provided.',
    section3: 'Account Registration',
    section3Text: 'To use certain platform features, you must create an account. You are responsible for its security.',
    section4: 'Liability',
    section4Text: 'DrivePoint is not liable for indirect, incidental, or consequential damages.',
    section5: 'Technical Support',
    section5Text: 'We strive to keep the platform stable and secure, but cannot guarantee continuous operation.',
    accept: 'I have read and accept the Terms of Service',
  }
}

export default function Terms() {
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
        <p className={`mt-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t.lastUpdated}: {new Date().toLocaleDateString()}
        </p>
      </section>

      <div className={`rounded-3xl border p-8 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} space-y-8`}>
        <section>
          <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t.section1}
          </h3>
          <p className={`text-base leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {t.section1Text}
          </p>
        </section>

        <hr className={isDark ? 'border-slate-700' : 'border-slate-200'} />

        <section>
          <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t.section2}
          </h3>
          <p className={`text-base leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {t.section2Text}
          </p>
        </section>

        <hr className={isDark ? 'border-slate-700' : 'border-slate-200'} />

        <section>
          <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t.section3}
          </h3>
          <p className={`text-base leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {t.section3Text}
          </p>
        </section>

        <hr className={isDark ? 'border-slate-700' : 'border-slate-200'} />

        <section>
          <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t.section4}
          </h3>
          <p className={`text-base leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {t.section4Text}
          </p>
        </section>

        <hr className={isDark ? 'border-slate-700' : 'border-slate-200'} />

        <section>
          <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t.section5}
          </h3>
          <p className={`text-base leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {t.section5Text}
          </p>
        </section>

        <hr className={isDark ? 'border-slate-700' : 'border-slate-200'} />

        <label className={`flex items-center gap-3 p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <input type="checkbox" className="w-4 h-4" />
          <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            {t.accept}
          </span>
        </label>
      </div>
    </div>
  )
}

