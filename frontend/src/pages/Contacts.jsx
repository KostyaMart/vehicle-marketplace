import React, { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import { LanguageContext } from '../context/LanguageContext'

const translations = {
  uk: {
    title: 'Контакти',
    subtitle: 'Зв\'яжіться з нами',
    intro: 'Для будь-яких питань та пропозицій зеленої гарнітури, будь ласка, звертайтесь до нас:',
    email: 'Електронна пошта',
    emailValue: 'support@drivepoint.ua',
    phone: 'Телефон',
    phoneValue: '+380 (44) 123-45-67',
    address: 'Адреса',
    addressValue: 'вул. Khreschatysky, 5, Київ, Україна, 02000',
    hours: 'Час роботи',
    hoursValue: 'Пн-Пт: 9:00 - 18:00, Сб-Нд: вихідні',
    form: 'Форма зворотного звідка',
    name: 'Ім\'я',
    emailField: 'E-mail',
    message: 'Повідомлення',
    send: 'Відправити',
    namePlaceholder: 'Ваше ім\'я',
    emailPlaceholder: 'Ваш email',
    messagePlaceholder: 'Ваше повідомлення',
  },
  en: {
    title: 'Contacts',
    subtitle: 'Get in Touch with Us',
    intro: 'If you have any questions or suggestions, please feel free to contact us:',
    email: 'Email',
    emailValue: 'support@drivepoint.ua',
    phone: 'Phone',
    phoneValue: '+380 (44) 123-45-67',
    address: 'Address',
    addressValue: 'Khreschatysky St., 5, Kyiv, Ukraine, 02000',
    hours: 'Business Hours',
    hoursValue: 'Mon-Fri: 9:00 AM - 6:00 PM, Sat-Sun: Closed',
    form: 'Contact Form',
    name: 'Name',
    emailField: 'Email',
    message: 'Message',
    send: 'Send',
    namePlaceholder: 'Your name',
    emailPlaceholder: 'Your email',
    messagePlaceholder: 'Your message',
  }
}

export default function Contacts() {
  const { isDark } = useContext(ThemeContext)
  const { language } = useContext(LanguageContext)
  const t = translations[language] || translations['uk']

  const handleSubmit = (e) => {
    e.preventDefault()
    // In production, this would send data to an API
    alert(language === 'uk' ? 'Спасибо за ваше повідомлення!' : 'Thank you for your message!')
  }

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

      <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
        <section className="space-y-6">
          <p className={`text-base leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {t.intro}
          </p>

          <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide text-sky-600 mb-2`}>
              {t.email}
            </h3>
            <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.emailValue}
            </p>
          </div>

          <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide text-sky-600 mb-2`}>
              {t.phone}
            </h3>
            <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.phoneValue}
            </p>
          </div>

          <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide text-sky-600 mb-2`}>
              {t.address}
            </h3>
            <p className={`text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {t.addressValue}
            </p>
          </div>

          <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide text-sky-600 mb-2`}>
              {t.hours}
            </h3>
            <p className={`text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {t.hoursValue}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t.form}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {t.name}
              </label>
              <input
                type="text"
                placeholder={t.namePlaceholder}
                required
                className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {t.emailField}
              </label>
              <input
                type="email"
                placeholder={t.emailPlaceholder}
                required
                className={`rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {t.message}
              </label>
              <textarea
                placeholder={t.messagePlaceholder}
                required
                rows="6"
                className={`rounded-xl px-4 py-3 outline-none transition resize-none ${isDark ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-sky-500' : 'border border-slate-300 focus:border-sky-500'}`}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700"
            >
              {t.send}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

