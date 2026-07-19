import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const STATUS_LABELS = {
  upcoming: 'قادمة',
  ongoing: 'جارية',
  finished: 'منتهية',
  archived: 'مؤرشفة',
}

export default function Elections() {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: '', election_date: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadElections()
  }, [])

  async function loadElections() {
    setLoading(true)
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setElections(data)
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) {
      setError('اسم الانتخابات مطلوب')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('elections').insert({
      name: form.name,
      type: form.type || null,
      election_date: form.election_date || null,
      description: form.description || null,
    })
    setSaving(false)
    if (error) {
      setError('حدث خطأ أثناء الحفظ: ' + error.message)
      return
    }
    setForm({ name: '', type: '', election_date: '', description: '' })
    setShowForm(false)
    loadElections()
  }

  async function updateStatus(id, status) {
    await supabase.from('elections').update({ status }).eq('id', id)
    loadElections()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">الانتخابات</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          {showForm ? 'إلغاء' : '+ انتخابات جديدة'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الانتخابات *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="تشريعية / جماعية..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={form.election_date}
                onChange={(e) => setForm({ ...form, election_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف (اختياري)</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">جاري التحميل...</p>
      ) : elections.length === 0 ? (
        <p className="text-gray-500">لا توجد انتخابات بعد.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-right px-4 py-3">الاسم</th>
                <th className="text-right px-4 py-3">النوع</th>
                <th className="text-right px-4 py-3">التاريخ</th>
                <th className="text-right px-4 py-3">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {elections.map((el) => (
                <tr key={el.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">{el.name}</td>
                  <td className="px-4 py-3 text-gray-600">{el.type || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{el.election_date || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={el.status}
                      onChange={(e) => updateStatus(el.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
