import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const navItems = [
  { to: '/', label: 'الرئيسية', end: true },
  { to: '/elections', label: 'الانتخابات' },
  { to: '/centers', label: 'المراكز' },
  { to: '/stations', label: 'مكاتب الاقتراع' },
  { to: '/monitors', label: 'المراقبون' },
  { to: '/candidates', label: 'المترشحون والأحزاب' },
  { to: '/results', label: 'النتائج' },
]

function MoroccoStar({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <path
        d="M50 8 L61 38 L93 38 L67 57 L77 88 L50 69 L23 88 L33 57 L7 38 L39 38 Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Layout() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 md:flex" dir="rtl">
      {/* Header - Moroccan flag theme */}
      <div className="md:hidden bg-gradient-to-l from-red-700 to-red-600 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <MoroccoStar className="w-6 h-6 text-emerald-400" />
          <h1 className="font-bold">لوحة التحكم</h1>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="border border-white/40 rounded-lg px-3 py-1.5 text-sm"
        >
          ☰ القائمة
        </button>
      </div>

      <aside
        className={`${
          menuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white border-b md:border-b-0 md:border-l border-gray-200 flex-col shrink-0`}
      >
        <div className="hidden md:flex items-center gap-3 bg-gradient-to-l from-red-700 to-red-600 p-5">
          <MoroccoStar className="w-9 h-9 text-emerald-400 shrink-0" />
          <div>
            <h1 className="font-bold text-lg text-white">لوحة التحكم</h1>
            <p className="text-xs text-red-100 mt-0.5">الانتخابات التشريعية 2026</p>
          </div>
        </div>
        <div className="hidden md:block px-5 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500">مرحباً بك</p>
          <p className="text-sm font-medium text-gray-800">{profile?.full_name}</p>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={signOut}
            className="w-full text-sm text-red-600 hover:bg-red-50 rounded-lg px-4 py-2.5 font-medium"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 overflow-y-auto min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
