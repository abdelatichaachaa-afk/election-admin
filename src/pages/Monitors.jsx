import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function maskCin(cin) {
  if (!cin || cin.length < 4) return cin
  return cin.slice(0, 2) + '****' + cin.slice(-2)
}

export default function Monitors() {
  const [elections, setElections] = useState([])
  const [selectedElection, setSelectedElection] = useState('')
  const [stations, setStations] = useState([])
  const [monitors, setMonitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    national_id: '',
    phone: '',
    pin: '',
    polling_station_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [revealedCin, setRevealedCin] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    loadElections()
  }, [])

  useEffect(() => {
    if (selectedElection) {
      loadStations(selectedElection)
      loadMonitors(selectedElection)
    }
  }, [selectedElection])

  async function loadElections() {
    const { data } = await supabase.from('elections').select('id, name').order('created_at', { ascending: false })
    setElections(data || [])
    if (data && data.length > 0) setSelectedElection(data[0].id)
    else setLoading(false)
  }

  async function loadStations(electionId) {
    const { data } = await supabase
      .from('polling_stations')
      .select('id, station_number, station_name, monitor_id')
      .eq('election_id', electionId)
      .order('station_number')
    setStations(data || [])
  }

  async function loadMonitors(electionId) {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*, polling_stations!profiles_polling_station_id_fkey(station_number, station_name)')
      .eq('role', 'monitor')
      .eq('election_id', electionId)
      .order('created_at', { ascending: false })
    if (!error) setMonitors(data || [])
    setLoading(false)
  }

  function toggleReveal(id) {
    setRevealedCin(function (prev) {
      const next = Object.assign({}, prev)
      next[id] = !next[id]
      return next
    })
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    if (!form.full_name.trim() || !form.national_id.trim() || !form.pin.trim()) {
      setError('الاسم ورقم البطاقة والرمز السري كلها مطلوبة')
      return
    }
    if (!/^[0-9]{4,10}$/.test(form.pin)) {
      setError('الرمز السري يجب أن يكون أرقام فقط (4 إلى 10 أرقام)')
      return
    }
    setSaving(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    try {
      const res = await fetch(
        'https://rbqjkjtrmxzlqzzpseky.supabase.co/functions/v1/create-monitor',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.access_token,
          },
          body: JSON.stringify({
            full_name: form.full_name,
            national_id: form.national_id,
            phone: form.phone,
            pin: form.pin,
            election_id: selectedElection,
            polling_station_id: form.polling_station_id || null,
          }),
        }
      )
      const json = await res.json()
      setSaving(false)
      if (!res.ok) {
        setError(json.error || 'حدث خطأ غير متوقع')
        return
      }
      setSuccessMsg('تم إنشاء حساب المراقب بنجاح')
      setForm({ full_name: '', national_id: '', phone: '', pin: '', polling_station_id: '' })
      setShowForm(false)
      loadMonitors(selectedElection)
      loadStations(selectedElection)
    } catch (err) {
      setSaving(false)
      setError('فشل الاتصال بالخادم: ' + String(err))
    }
  }

  async function toggleStatus(monitor) {
    const newStatus = monitor.status === 'active' ? 'disabled' : 'active'
    await supabase.from('profiles').update({ status: newStatus }).eq('id', monitor.id)
    loadMonitors(selectedElection)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await supabase.from('profiles').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    loadMonitors(selectedElection)
    loadStations(selectedElection)
  }

  const availableStations = stations.filter(function (s) {
    return !s.monitor_id
  })

  return (
   <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800">المراقبون</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={!selectedElection}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {showForm ? 'إلغاء' : '+ مراقب جديد'}
        </button>
      </div>

      {elections.length === 0 ? (
        <p className="text-gray-500">أنشئ انتخابات أولاً.</p>
      ) : (
        <div>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">الانتخابات</label>
            <select
              value={selectedElection}
              onChange={(e) => setSelectedElection(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2"
            >
              {elections.map((el) => (
                <option key={el.id} value={el.id}>{el.name}</option>
              ))}
            </select>
          </div>

          {successMsg && (
            <p className="text-emerald-700 bg-emerald-50 rounded-lg px-4 py-2 text-sm mb-4">{successMsg}</p>
          )}

          {showForm && (
            <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 space-y-3">
              <h3 className="font-semibold text-gray-700">مراقب جديد</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل *</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم البطاقة الوطنية *</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={form.national_id}
                    onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                    placeholder="AB123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرمز السري (PIN) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value })}
                    placeholder="4 إلى 10 أرقام"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مكتب الاقتراع (اختياري)</label>
                {availableStations.length === 0  ? (
                  <p className="text-sm text-gray-500">لا توجد مكاتب متاحة بدون مراقب حالياً.</p>
                ) : (
                  <select
                    value={form.polling_station_id}
                    onChange={(e) => setForm({ ...form, polling_station_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">— بدون تعيين الآن —</option>
                    {availableStations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.station_number} {s.station_name ? '(' + s.station_name + ')' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50">
                {saving ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
              </button>
            </form>
          )}

          {loading ? (
            <p className="text-gray-500">جاري التحميل...</p>
          ) : monitors.length === 0 ? (
            <p className="text-gray-500">لا يوجد مراقبون بعد لهذه الانتخابات.</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-right px-4 py-3">الاسم</th>
                    <th className="text-right px-4 py-3">رقم البطاقة</th>
                    <th className="text-right px-4 py-3">الهاتف</th>
                    <th className="text-right px-4 py-3">المكتب</th>
                    <th className="text-right px-4 py-3">الحالة</th>
                    <th className="text-right px-4 py-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {monitors.map((m) => (
                    <tr key={m.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-800">{m.full_name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <button
                          onClick={() => toggleReveal(m.id)}
                          className="underline decoration-dotted"
                        >
                          {revealedCin[m.id] ? m.national_id : maskCin(m.national_id)}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {m.polling_stations
                          ? m.polling_stations.station_number + (m.polling_stations.station_name ? ' (' + m.polling_stations.station_name + ')' : '')
                          : '— غير معيّن —'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={
                          'px-2 py-0.5 rounded-full text-xs font-medium ' +
                          (m.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600')
                        }>
                          {m.status === 'active' ? 'مفعّل' : 'معطّل'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => toggleStatus(m)} className="text-emerald-700 hover:bg-emerald-50 rounded-lg px-2 py-1 text-sm ml-1">
                          {m.status === 'active' ? 'تعطيل' : 'تفعيل'}
                        </button>
                        <button onClick={() => setDeleteTarget(m)} className="text-red-600 hover:bg-red-50 rounded-lg px-2 py-1 text-sm">حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" dir="rtl">
            <h3 className="font-bold text-gray-800 mb-2">تأكيد الحذف</h3>
            <p className="text-gray-600 text-sm mb-5">
              هل أنت متأكد من حذف المراقب "{deleteTarget.full_name}"؟
            </p>
            <div className="flex gap-2">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium">نعم، احذف</button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
            }
