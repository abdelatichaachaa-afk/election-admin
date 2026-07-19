import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value ?? '—'}</p>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    const [elections, centers, stations, monitors, candidates, submitted, results] =
      await Promise.all([
        supabase.from('elections').select('id', { count: 'exact', head: true }),
        supabase.from('centers').select('id', { count: 'exact', head: true }),
        supabase.from('polling_stations').select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'monitor'),
        supabase.from('candidates').select('id', { count: 'exact', head: true }),
        supabase
          .from('polling_stations')
          .select('id', { count: 'exact', head: true })
          .in('status', ['submitted', 'validated', 'locked']),
        supabase.from('results').select('votes'),
      ])

    const totalVotes = (results.data || []).reduce((sum, r) => sum + (r.votes || 0), 0)

    setStats({
      elections: elections.count,
      centers: centers.count,
      stations: stations.count,
      monitors: monitors.count,
      candidates: candidates.count,
      submitted: submitted.count,
      totalVotes,
    })
    setLoading(false)
  }

  if (loading) {
    return <p className="text-gray-500">جاري تحميل الإحصائيات...</p>
  }

  const notSubmitted = (stats.stations ?? 0) - (stats.submitted ?? 0)

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-5">نظرة عامة</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="عدد الانتخابات" value={stats.elections} />
        <StatCard label="عدد المراكز" value={stats.centers} />
        <StatCard label="عدد المكاتب" value={stats.stations} />
        <StatCard label="عدد المراقبين" value={stats.monitors} />
        <StatCard label="عدد المترشحين" value={stats.candidates} />
        <StatCard label="مكاتب أرسلت نتائجها" value={stats.submitted} />
        <StatCard label="مكاتب لم ترسل بعد" value={notSubmitted} />
        <StatCard label="مجموع الأصوات" value={stats.totalVotes?.toLocaleString('ar')} />
      </div>
    </div>
  )
}
