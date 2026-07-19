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

export default function Layout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex bg-gray-50" dir="rtl">
      <aside className="w-60 bg-white border-l border-gray-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-200">
          <h1 className="font-bold text-lg text-gray-800">لوحة التحكم</h1>
          <p className="text-xs text-gray-500 mt-1">{profile?.full_name}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
