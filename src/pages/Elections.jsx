 import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const STATUS_LABELS = {
  upcoming: 'قادمة',
  ongoing: 'جارية',
  finished: 'منتهية',
  archived: 'مؤرشفة',
}

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

function Banner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-red-700 via-red-600 to-red-700 text-white p-6 mb-6">
      <MoroccoStar className="absolute -left-4 -top-4 w-32 h-32 text-white/10" />
      <MoroccoStar className="absolute -right-6 -bottom-6 w-40 h-40 text-white/10" />
      <div className="relative flex items-center gap-4">
        <MoroccoStar className="w-14 h-14 text-emerald-400 shrink-0" />
        <div>
          <h1 className="text-xl font-bold">الانتخابات التشريعية 2026</h1>
          <p className="text-red-100 text-sm mt-1">المملكة المغربية — إدارة ومتابعة نتائج الاقتراع</p>
        </div>
      </div>
    </div>
  )
}

export default function Elections() {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', type: '', election_date: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

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

  function openCreateForm() {
    setEditingId(null)
    setForm({ name: '', type: '', election_date: '', description: '' })
    setShowForm(true)
    setError('')
  }

  function openEditForm(el) {
    setEditingId(el.id)
    setForm({
      name: el.name || '',
      type: el.type || '',
      election_date: el.election_date || '',
      description: el.description || '',
    })
    setShowForm(true)
    setError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) {
      setError('اسم الانتخابات مطلوب')
      return
    }
    setSaving(true)

    const payload = {
      name: form.name,
      type: form.type || null,
      election_date: form.election_date || null,
      description: form.description || null,
    }

    let error
    if (editingId) {
      ;({ error } = await supabase.from('elections').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('elections').insert(payload))
    }

    setSaving(false)
    if (error) {
      setError('حدث خطأ أثناء الحفظ: ' + error.message)
      return
    }
    setShowForm(false)
    setEditingId(null)
    loadElections()
  }

  async function updateStatus(id, status) {
    await supabase.from('elections').update({ status }).eq('id', id)
    loadElections()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await supabase.from('elections').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    loadElections()
  }

  return (
    <div>
      <Banner />

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">الانتخابات</h2>
        <button
          onClick={showForm ? () => setShowForm(false) : openCreateForm}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          {showForm ? 'إلغاء' : '+ انتخابات جديدة'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 space-y-3"
        >
          <h3 className="font-semibold text-gray-700">
            {editingId ? 'تعديل الانتخابات' : 'انتخابات جديدة'}
          </h3>
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
            {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'حفظ'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">جاري التحميل...</p>
      ) : elections.length === 0 ? (
        <p className="text-gray-500">لا توجد انتخابات بعد.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-right px-4 py-3">الاسم</th>
                <th className="text-right px-4 py-3">النوع</th>
                <th className="text-right px-4 py-3">التاريخ</th>
                <th className="text-right px-4 py-3">الحالة</th>
                <th className="text-right px-4 py-3">إجراءات</th>
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => openEditForm(el)}
                      className="text-emerald-700 hover:bg-emerald-50 rounded-lg px-2 py-1 text-sm ml-1"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => setDeleteTarget(el)}
                      className="text-red-600 hover:bg-red-50 rounded-lg px-2 py-1 text-sm"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" dir="rtl">
            <h3 className="font-bold text-gray-800 mb-2">تأكيد الحذف</h3>
            <p className="text-gray-600 text-sm mb-5">
              هل أنت متأكد من حذف "{deleteTarget.name}"؟ سيتم حذف كل البيانات المرتبطة بها (مراكز، مكاتب، نتائج). لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium"
              >
                نعم، احذف
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
