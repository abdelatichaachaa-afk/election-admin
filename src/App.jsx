import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import Login from './pages/Login'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import Elections from './pages/Elections'
import Centers from './pages/Centers'
import ComingSoon from './pages/ComingSoon'

function ProtectedApp() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        جاري التحميل...
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  if (profile && profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600" dir="rtl">
        هذا الحساب لا يملك صلاحية الوصول للوحة التحكم.
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="elections" element={<Elections />} />
        <Route path="centers" element={<Centers />} />
        <Route path="stations" element={<ComingSoon title="مكاتب الاقتراع" />} />
        <Route path="monitors" element={<ComingSoon title="المراقبون" />} />
        <Route path="candidates" element={<ComingSoon title="المترشحون والأحزاب" />} />
        <Route path="results" element={<ComingSoon title="النتائج" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </BrowserRouter>
  )
}
