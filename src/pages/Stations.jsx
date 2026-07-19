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

  const centralStations = stations.filter(function (s) {
    return s.station_type === 'central'
  })

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
      const result = await supabase.from('polling_stations').update(payload).eq('id', editingId)
      error = result.error
    } else {
      const result = await supabase.from('polling_stations').insert(payload)
      error = result.error
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
    const s = stations.find(function (x) {
      return x.id === id
    })
    if (!s) return '—'
    return s.station_number + (s.station_name ? ' (' + s.station_name + ')' : '')
  }

  return (
    <div>PLACEHOLDER</div>
  )
                 }
