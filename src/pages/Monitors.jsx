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
    <div>PLACEHOLDER</div>
  )
            }
