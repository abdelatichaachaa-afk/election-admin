import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const STATUS_LABELS = {
  not_started: 'لم يتم الإدخال',
  in_progress: 'قيد الإدخال',
  submitted: 'تم إرسال النتائج',
  pending_review: 'في انتظار المراجعة',
  validated: 'تمت المصادقة',
  locked: 'تم القفل',
}

export default function Stations() {
  const [elections, setElections] = useState([])
  const [selectedElection, setSelectedElection] = useState('')
  const [centers, setCenters] = useState([])
  const [selectedCenter, setSelectedCenter] = useState('')
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    station_number: '',
    station_name: '',
    station_type: 'local',
    central_station_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    loadElections()
  }, [])

  useEffect(() => {
    if (selectedElection) loadCenters(selectedElection)
  }, [selectedElection])

  useEffect(() => {
    if (selectedCenter) loadStations(selectedCenter)
    else setStations([])
  }, [selectedCenter])

  async function loadElections() {
    const { data } = await supabase.from('elections').select('id, name').order('created_at', { ascending: false })
    setElections(data || [])
    if (data && data.length > 0) setSelectedElection(data[0].id)
    else setLoading(false)
  }

  async function loadCenters(electionId) {
    const { data } = await supabase.from('centers').select('id, name').eq('election_id', electionId).order('name')
    setCenters(data || [])
    if (data && data.length > 0) setSelectedCenter(data[0].id)
    else {
      setSelectedCenter('')
      setLoading(false)
    }
  }

  async function loadStations(centerId) {
    setLoading(true)
    const { data, error } = await supabase
      .from('polling_stations')
      .select('*')
      .eq('center_id', centerId)
      .order('station_number')
    if (!error) setStations(data)
    setLoading(false)
  }

  const centralStations = stations.filter((s) => s.station_type === 'central')

  function openCreateForm() {
    setEditingId(null)
    setForm({ station_number: '', station_name: '', station_type: 'local', central_station_id: '' })
    setShowForm(true)
    setError('')
  }

  function openEditForm(s) {
    setEditingId(s.id)
    setForm({
      station_number: s.station_number || '',
      station_name: s.station_name || '',
      station_type: s.station_type || 'local',
      central_station_id: s.central_station_id || '',
    })
    setShowForm(true)
    setError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!form.station_number.trim()) {
      setError('رقم المكتب مطلوب')
      return
    }
    if (!selectedCenter) {
      setError('اختر المركز أولاً')
      return
    }
    setSaving(true)

    const payload = {
      election_id: selectedElection,
      center_id: selectedCenter,
      station_number: form.station_number,
      station_name: form.station_name || null,
      station_type: form.station_type,
      central_station_id: form.station_type === 'local' ? (form.central_station_id || null) : null,
    }

    let error
    if (editingId) {
      ;({ error } = await supabase.from('polling_stations').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('polling_stations').insert(payload))
    }

    setSaving(false)
    if (error) {
      setError('حدث خطأ: ' + error.message)
      return
    }
    setShowForm(false)
    setEditingId(null)
    loadStations(selectedCenter)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await supabase.from('polling_stations').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    loadStations(selectedCenter)
  }

  function stationTypeLabel(s) {
    return s.station_type === 'central' ? 'مركزي' : 'فرعي'
  }

  function centralName(id) {
    const s = stations.find((x) => x.id === id)
    return s ? `${s.station_number} ${s.station_name ? '(' + s.station_name + ')' : ''}` : '—'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800">مكاتب الاقتراع</h2>
        <button
          onClick={showForm ? () => setShowForm(false) : openCreateForm}
          disabled={!selectedCenter}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {showForm ? 'إلغاء' : '+ مكتب جديد'}
        </button>
      </div>

      {elections.length === 0 ? (
        <p className="text-gray-500">أنشئ انتخابات أولاً.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الانتخابات</label>
              <select
                value={selectedElection}
                onChange={(e) => setSelectedElection(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {elections.map((el) => (
                  <option key={el.id} value={el.id}>{el.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المركز</label>
              {centers.length === 0  ? (
                <p className="text-sm text-gray-500 py-2">لا توجد مراكز لهذه الانتخابات بعد.</p>
              ) : (
                <select
                  value={selectedCenter}
                  onChange={(e) => setSelectedCenter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 space-y-3">
              <h3 className="font-semibold text-gray-700">{editingId ? 'تعديل المكتب' : 'مكتب جديد'}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم المكتب *</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={form.station_number}
                    onChange={(e) => setForm({ ...form, station_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم المكتب (اختياري)</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={form.station_name}
                    onChange={(e) => setForm({ ...form, station_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع المكتب</label>
                <select
                  value={form.station_type}
                  onChange={(e) => setForm({ ...form, station_type: e.target.value, central_station_id: '' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="local">فرعي</option>
                  <option value="central">مركزي</option>
                </select>
              </div>
              {form.station_type === 'local' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المكتب المركزي التابع له (اختياري)</label>
                  {centralStations.length === 0  (
                    <p className="text-sm text-gray-500">لا يوجد مكتب مركزي بهذا المركز بعد.</p>
                   ) : (
                    <select
                      value={form.central_station_id}
                      onChange={(e) => setForm({ ...form, central_station_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">— بدون ربط —</option>
                      {centralStations.map((cs) => (
                        <option key={cs.id} value={cs.id}>
                          {cs.station_number} {cs.station_name ? `(${cs.station_name})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50">
                {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'حفظ'}
              </button>
            </form>
          )}

          {loading ? (
            <p className="text-gray-500">جاري التحميل...</p>
          ) : !selectedCenter ? (
            <p className="text-gray-500">اختر مركزاً لعرض مكاتبه.</p>
          ) : stations.length === 0 ? (
            <p className="text-gray-500">لا توجد مكاتب بعد لهذا المركز.</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm min-w-[650px]">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-right px-4 py-3">الرقم</th>
                    <th className="text-right px-4 py-3">الاسم</th>
                    <th className="text-right px-4 py-3">النوع</th>
                    <th className="text-right px-4 py-3">المكتب المركزي</th>
                    <th className="text-right px-4 py-3">الحالة</th>
                    <th className="text-right px-4 py-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((s) => (
                    <tr key={s.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-800">{s.station_number}</td>
                      <td className="px-4 py-3 text-gray-600">{s.station_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.station_type === 'central' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {stationTypeLabel(s)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {s.station_type === 'local' && s.central_station_id ? centralName(s.central_station_id) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{STATUS_LABELS[s.status] || s.status}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => openEditForm(s)} className="text-emerald-700 hover:bg-emerald-50 rounded-lg px-2 py-1 text-sm ml-1">تعديل</button>
                        <button onClick={() => setDeleteTarget(s)} className="text-red-600 hover:bg-red-50 rounded-lg px-2 py-1 text-sm">حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" dir="rtl">
            <h3 className="font-bold text-gray-800 mb-2">تأكيد الحذف</h3>
            <p className="text-gray-600 text-sm mb-5">
              هل أنت متأكد من حذف المكتب رقم "{deleteTarget.station_number}"؟ سيتم حذف كل النتائج المرتبطة به.
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
