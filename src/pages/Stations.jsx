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
    return s.station_ty
