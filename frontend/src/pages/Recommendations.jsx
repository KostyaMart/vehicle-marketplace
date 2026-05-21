import React, { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { getRecommendations } from '../api/listings'
import { ThemeContext } from '../context/ThemeContext'
import { getFavorites, toggleFavoriteItem } from '../api/auth'
import { LanguageContext } from '../context/LanguageContext'

const CAR_BRANDS = ['Audi','Chevrolet','Citroen','Dacia','Fiat','Ford','Hyundai','Jeep','Kia','Lancia','Lexus','Mazda','Mercedes-Benz','Mitsubishi','Nissan','Opel','Peugeot','Renault','SEAT','Skoda','Subaru','Tesla','Toyota','Volvo','Volkswagen']
const MOTO_BRANDS = ['Aprilia','BMW','Ducati','Harley-Davidson','Honda','Indian','Kawasaki','KTM','Suzuki','Triumph','Yamaha']

const translations = {
  uk: {
    recommendations: 'Рекомендації',
    adjustWeights: 'Налаштуйте ваги та фільтри, щоб ранжувати оголошення за своїми пріоритетами.',
    filters: 'Фільтри',
    vehicleType: 'Тип транспорту',
    car: 'Авто',
    motorcycle: 'Мото',
    filterByBrand: 'Фільтр за маркою',
    allBrands: 'Всі марки',
    weightDiagram: 'Діаграма ваг',
    price: 'Ціна',
    year: 'Рік',
    mileage: 'Пробіг',
    weightPrice: 'Вага ціни',
    weightYear: 'Вага року',
    weightMileage: 'Вага пробігу',
    updateRecommendations: 'Оновити рекомендації',
    reset: 'Скинути',
    loading: 'Завантаження рекомендацій…',
    noResults: 'Рекомендацій не знайдено.',
    open: 'Відкрити',
    close: 'Закрити',
    noPhoto: 'Фото відсутнє',
  },
  en: {
    recommendations: 'Recommendations',
    adjustWeights: 'Adjust weights and filters to rank listings by your priorities.',
    filters: 'Filters',
    vehicleType: 'Vehicle Type',
    car: 'Car',
    motorcycle: 'Motorcycle',
    filterByBrand: 'Filter by Brand',
    allBrands: 'All Brands',
    weightDiagram: 'Weight Diagram',
    price: 'Price',
    year: 'Year',
    mileage: 'Mileage',
    weightPrice: 'Price Weight',
    weightYear: 'Year Weight',
    weightMileage: 'Mileage Weight',
    updateRecommendations: 'Update Recommendations',
    reset: 'Reset',
    loading: 'Loading recommendations…',
    noResults: 'No recommendations found.',
    open: 'Open',
    close: 'Close',
    noPhoto: 'No photo',
  }
}

export default function Recommendations(){
  const { isDark } = useContext(ThemeContext)
  const { language } = useContext(LanguageContext)
  const t = translations[language] || translations['uk']

  const [items, setItems] = useState([])
  const [weights, setWeights] = useState({ wPrice:0.5, wYear:0.3, wMileage:0.2, brand:'' })
  const [vehicleType, setVehicleType] = useState('car')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  function RecommendationCard({ item }) {
    const [isFavorite, setIsFavorite] = useState(() => {
      const favorites = getFavorites()
      return favorites.some((fav) => fav.id === item.id)
    })

    function toggleFavorite(e) {
      e.preventDefault()
      const nextState = toggleFavoriteItem(item)
      setIsFavorite(nextState)
    }

    return (
      <Link to={`/listings/${item.id}`} className={`block rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md relative group`}>
        <button
          type="button"
          onClick={toggleFavorite}
          className={`absolute top-5 right-5 z-10 rounded-full p-2 transition ${
            isFavorite
              ? 'bg-red-500 text-white'
              : isDark
                ? 'bg-slate-700 text-slate-300 group-hover:bg-red-500 group-hover:text-white'
                : 'bg-slate-100 text-slate-600 group-hover:bg-red-500 group-hover:text-white'
          }`}
          aria-label="Toggle favorite"
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>

        <div className="mb-4 overflow-hidden rounded-2xl bg-slate-100">
          {Array.isArray(item.photoUrls) && item.photoUrls[0] ? (
            <img src={item.photoUrls[0]} alt={item.title} className="h-52 w-full object-cover" />
          ) : (
            <div className={`flex h-52 items-center justify-center text-sm ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{t.noPhoto}</div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.vehicleType==='motorcycle' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
                {item.vehicleType==='motorcycle' ? t.motorcycle : t.car}
              </span>
            </div>
            <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.brand} {item.model} • {item.year} • {item.mileage} км</div>
          </div>
          <div className="text-xl font-bold text-sky-700">${item.price}</div>
        </div>
        <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>
      </Link>
    )
  }

  useEffect(()=>{ load() }, [])

  async function load(opts = {}){
    setLoading(true); setError('')
    const vt = opts.vehicleType ?? vehicleType
    const brand = opts.brand !== undefined ? opts.brand : weights.brand
    const params = {
      wPrice: weights.wPrice,
      wYear: weights.wYear,
      wMileage: weights.wMileage,
      ...(brand ? { brand } : {}),
      ...(vt ? { vehicleType: vt } : {}),
    }
    const data = await getRecommendations(params)
    if (data?.error){ setError(data.error); setItems([]) }
    else setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function applyWeights(e){ e?.preventDefault(); await load() }

  function handleVehicleTypeClick(type){ setVehicleType(type); setWeights(prev=>({...prev, brand:''})); load({vehicleType:type, brand:''}) }


  function DonutChart({values, colors, size=140, strokeWidth=18}){
    const total = values.reduce((s,v)=>s+v,0)
    const perc = total > 0 ? values.map(v=>v/total) : [0,0,0]
    const r = (size - strokeWidth) / 2
    const C = 2 * Math.PI * r
    let offset = 0
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        <g transform={`translate(${size/2},${size/2}) rotate(-90)`}>
          {perc.map((p,i)=>{
            const dash = +(p * C).toFixed(3)
            const dasharr = `${dash} ${C - dash}`
            const dashoff = -offset
            offset += dash
            return <circle key={i} r={r} fill="transparent" stroke={colors[i]} strokeWidth={strokeWidth} strokeLinecap="butt" strokeDasharray={dasharr} strokeDashoffset={dashoff} style={{transition:'stroke-dasharray 450ms, stroke-dashoffset 450ms'}} />
          })}
          <circle r={r} fill="transparent" stroke={isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.05)'} strokeWidth={strokeWidth} />
        </g>
      </svg>
    )
  }

  function FiltersPanel({isModal=false}){
    const brandOptions = vehicleType === 'motorcycle' ? MOTO_BRANDS : CAR_BRANDS
    return (
      <div className={isModal? 'p-2':''} role={isModal?'dialog':undefined} aria-modal={isModal? 'true': undefined}>
        <div className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.filters}</div>
        <div className={`overflow-y-auto max-h-96 space-y-4 pr-2 ${isDark ? 'scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700' : 'scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100'}`}>
          <div className="mb-4">
            <div className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.vehicleType}</div>
            <div className="flex gap-2">
              <button type="button" aria-pressed={vehicleType==='car'} onClick={()=>handleVehicleTypeClick('car')} className={`flex-1 rounded-md px-3 py-2 text-sm transition ${vehicleType==='car' ? 'bg-sky-600 text-white' : isDark ? 'bg-slate-700 text-white border border-slate-600' : 'bg-white border'}`}>{t.car}</button>
              <button type="button" aria-pressed={vehicleType==='motorcycle'} onClick={()=>handleVehicleTypeClick('motorcycle')} className={`flex-1 rounded-md px-3 py-2 text-sm transition ${vehicleType==='motorcycle' ? 'bg-sky-600 text-white' : isDark ? 'bg-slate-700 text-white border border-slate-600' : 'bg-white border'}`}>{t.motorcycle}</button>
            </div>
          </div>

          <div className="mb-4">
            <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.filterByBrand}</label>
            <select value={weights.brand||''} onChange={(e)=>{ const b=e.target.value; setWeights(prev=>({...prev, brand:b})); load({vehicleType, brand:b}) }} className={`w-full rounded-md px-3 py-2 transition ${isDark ? 'bg-slate-700 border border-slate-600 text-white' : 'border'}`}>
              <option value="">{t.allBrands}</option>
              {brandOptions.map(b=> <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={()=>{ setWeights(prev=>({...prev, brand:''})); load({vehicleType, brand:''}); if(isModal) setShowFiltersModal(false) }} className="flex-1 rounded-md bg-sky-600 px-3 py-2 text-white text-sm transition hover:bg-sky-700">{t.updateRecommendations}</button>
            <button onClick={()=>{ setWeights(prev=>({...prev, brand:''})); setVehicleType('car'); load({vehicleType: 'car', brand: ''}); if(isModal) setShowFiltersModal(false) }} className={`flex-1 rounded-md px-3 py-2 text-sm transition ${isDark ? 'bg-slate-700 text-white border border-slate-600 hover:bg-slate-600' : 'border hover:bg-slate-50'}`}>{t.reset}</button>
          </div>
        </div>
      </div>
    )
  }

  // weights normalization not required elsewhere; kept simple without extra memo

  return (
    <div className={`space-y-6 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
      <div className="lg:grid lg:grid-cols-3 lg:gap-6 flex flex-col">
        <div className="lg:col-span-2 space-y-6">
          <div className={`rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4 sm:p-6 shadow-sm`}>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.recommendations}</h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.adjustWeights}</p>

            <form onSubmit={applyWeights} className="mt-6 grid gap-6 lg:grid-cols-3 items-start">
              <div className="lg:col-span-1 flex flex-col items-center gap-4">
                <div className={`w-full max-w-xs rounded-xl p-4 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <div className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.weightDiagram}</div>
                  <DonutChart values={[weights.wPrice, weights.wYear, weights.wMileage]} colors={["#06b6d4","#10b981","#f59e0b"]} />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                    <div className="flex flex-col items-center"><span className="w-3 h-3 rounded-full" style={{background:'#06b6d4'}}></span><span className={`mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.price}</span></div>
                    <div className="flex flex-col items-center"><span className="w-3 h-3 rounded-full" style={{background:'#10b981'}}></span><span className={`mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.year}</span></div>
                    <div className="flex flex-col items-center"><span className="w-3 h-3 rounded-full" style={{background:'#f59e0b'}}></span><span className={`mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.mileage}</span></div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.weightPrice}<div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{weights.wPrice.toFixed(2)}</div>
                    <input aria-label={t.weightPrice} type="range" min={0} max={1} step={0.01} value={weights.wPrice} onChange={e=>setWeights({...weights, wPrice: parseFloat(e.target.value)||0})} className="w-full" />
                  </label>
                  <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.weightYear}<div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{weights.wYear.toFixed(2)}</div>
                    <input aria-label={t.weightYear} type="range" min={0} max={1} step={0.01} value={weights.wYear} onChange={e=>setWeights({...weights, wYear: parseFloat(e.target.value)||0})} className="w-full" />
                  </label>
                  <label className={`flex flex-col gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.weightMileage}<div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{weights.wMileage.toFixed(2)}</div>
                    <input aria-label={t.weightMileage} type="range" min={0} max={1} step={0.01} value={weights.wMileage} onChange={e=>setWeights({...weights, wMileage: parseFloat(e.target.value)||0})} className="w-full" />
                  </label>
                  <div />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 items-end">
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <button aria-label={t.updateRecommendations} className="flex-1 rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white text-sm sm:text-base hover:bg-sky-700 transition">{t.updateRecommendations}</button>
                    <button type="button" onClick={()=>{ setWeights({ wPrice:0.5,wYear:0.3,wMileage:0.2,brand:'' }); setVehicleType('car'); load({ vehicleType: 'car', brand: '' }) }} className={`flex-1 rounded-xl px-4 py-3 text-sm transition ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}>{t.reset}</button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {loading ? (
            <div className={`rounded-2xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>{t.loading}</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <RecommendationCard key={item.id} item={item} />
              ))}
              {!items.length && <div className={`rounded-2xl p-6 text-center shadow-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>{t.noResults}</div>}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className={`sticky top-24 rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4 shadow-sm hidden lg:block`}>
            <FiltersPanel />
          </div>
          <button onClick={()=>setShowFiltersModal(true)} className="lg:hidden fixed bottom-6 right-4 z-40 rounded-full bg-sky-600 p-3 text-white shadow-lg hover:bg-sky-700 transition" aria-label={t.open}>{t.filters}</button>
        </div>
      </div>

      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowFiltersModal(false)} aria-hidden="true"></div>
          <div className="relative w-full max-w-md p-4">
            <div className={`rounded-xl p-4 shadow-lg ${isDark ? 'bg-slate-800 text-white' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold">{t.filters}</div>
                <button onClick={()=>setShowFiltersModal(false)} aria-label={t.close} className={`text-lg transition ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>✕</button>
              </div>
              <FiltersPanel isModal={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


