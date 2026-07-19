import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Centers() {
  const [elections, setElections] = useState([])
  const [selectedElection, setSelectedElection] = useState('')
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', address: '', city: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    loadElections()
  }, [])

  useEffect(() => {
    if (selectedElection) loadCenters(selectedElection)
  }, [selectedElection])

  async function loadElections() {
    const { data } = await supabase.from('elections').select('id, name').order('created_at', { ascending: false })
    setElections(data || [])
    if (data && data.length > 0) setSelectedElection(data[0].id)
    else setLoading(false)
  }

  async function loadCenters(electionId) {
    setLoading(true)
    const { data, error } = await supabase
      .from('centers')
      .select('*')
      .eq('election_id', electionId)
      .order('created_at', { ascending: false })
    if (!error) setCenters(data)
    setLoading(false)
  }

  function openCreateForm() {
    setEditingId(null)
    setForm({ name: '', code: '', address: '', city: '' })
    setShowForm(true)
    setError('')
  }

  function openEditForm(c) {
    setEditingId(c.id)
    setForm({ name: c.name || '', code: c.code || '', address: c.address || '', city: c.city || '' })
    setShowForm(true)
    setError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) {
      setError('اسم المركز مطلوب')
      return
    }
    if (!selectedElection) {
      setError('اختر الانتخابات أولاً')
      return
    }
    setSaving(true)

    const payload = {
      election_id: selectedElection,
      name: form.name,
      code: form.code || null,
      address: form.address || null,
      city: form.city || null,
    }

    let error
    if (editingId) {
      ;({ error } = await supabase.from('centers').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('centers').insert(payload))
    }

    setSaving(false)
    if (error) {
      setError('حدث خطأ: ' + error.message)
      return
    }
    setShowForm(false)
    setEditingId(null)
    loadCenters(selectedElection)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await supabase.from('centers').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    loadCenters(selectedElection)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800">المراكز الانتخابية</h2>
        <button
          onClick={showForm ? () => setShowForm(false) : openCreateForm}
          disabled={!selectedElection}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {showForm ? 'إلغاء' : '+ مركز جديد'}
        </button>
      </div>

      {elections.length === 0 ? (
        <p className="text-gray-500">أنشئ انتخابات أولاً من صفحة "الانتخابات" قبل إضافة المراكز.</p>
      ) : (
        <>
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

          {showForm && (
            <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 space-y-3">
              <h3 className="font-semibold text-gray-700">{editingId ? 'تعديل المركز' : 'مركز جديد'}</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المركز *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رمز المركز</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50">
                {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'حفظ'}
              </button>
            </form>
          )}

          {loading ? (
            <p className="text-gray-500">جاري التحميل...</p>
          ) : centers.length === 0 ? (
            <p className="text-gray-500">لا توجد مراكز بعد لهذه الانتخابات.</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-right px-4 py-3">الاسم</th>
                    <th className="text-right px-4 py-3">الرمز</th>
                    <th className="text-right px-4 py-3">المدينة</th>
                    <th className="text-right px-4 py-3">العنوان</th>
                    <th className="text-right px-4 py-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {centers.map((c) => (
                    <tr key={c.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.code || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.city || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.address || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => openEditForm(c)} className="text-emerald-700 hover:bg-emerald-50 rounded-lg px-2 py-1 text-sm ml-1">تعديل</button>
                        <button onClick={() => setDeleteTarget(c)} className="text-red-600 hover:bg-red-50 rounded-lg px-2 py-1 text-sm">حذف</button>
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
              هل أنت متأكد من حذف "{deleteTarget.name}"؟ سيتم حذف كل المكاتب والنتائج المرتبطة به.
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
