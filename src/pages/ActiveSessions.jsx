import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActiveSessions } from '../services/sessionService'
import Button from '../components/common/Button'

export default function ActiveSessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    try {
      const list = await getActiveSessions()
      setSessions(list)
    } catch (err) {
      setError('Error al cargar campeonatos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function getModeLabel(mode) {
    return mode === 'queue' ? 'Cola clásica' : 'Todos contra todos'
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <button
        onClick={() => navigate('/')}
        className="self-start text-sm text-gray-400 hover:text-white cursor-pointer"
      >
        ← Volver
      </button>

      <h2 className="text-2xl font-bold text-white">🏆 Campeonatos activos</h2>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 pt-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e94560] border-t-transparent" />
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && sessions.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-gray-400">No hay campeonatos activos</p>
          <p className="mt-2 text-sm text-gray-500">
            Sé el primero en crear uno
          </p>
          <Button onClick={() => navigate('/create')} className="mt-4">
            Crear campeonato
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => navigate(`/session/${session.code}`)}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-[#e94560]/50 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div>
              <p className="font-semibold text-white">{session.name}</p>
              <p className="text-xs text-gray-500">
                {getModeLabel(session.mode)} · {session.teamCount || 0} equipos
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Código</p>
              <p className="font-mono text-sm font-bold text-[#e94560]">
                {session.code}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
