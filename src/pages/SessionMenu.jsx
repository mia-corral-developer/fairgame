import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSessionByCode } from '../services/sessionService'
import Button from '../components/common/Button'

export default function SessionMenu() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSession()
  }, [code])

  async function loadSession() {
    try {
      const data = await getSessionByCode(code.toUpperCase())
      if (!data) {
        setError('Campeonato no encontrado')
      } else {
        setSession(data)
      }
    } catch (err) {
      setError('Error al cargar')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function getModeLabel(mode) {
    return mode === 'queue' ? 'Cola clásica' : 'Todos contra todos'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e94560] border-t-transparent" />
        <p className="text-sm text-gray-400">Cargando...</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex flex-col gap-6 pt-4">
        <button
          onClick={() => navigate('/sessions')}
          className="self-start text-sm text-gray-400 hover:text-white cursor-pointer"
        >
          ← Volver
        </button>
        <p className="text-red-400">{error || 'Campeonato no encontrado'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <button
        onClick={() => navigate('/sessions')}
        className="self-start text-sm text-gray-400 hover:text-white cursor-pointer"
      >
        ← Volver
      </button>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <h2 className="text-2xl font-bold text-white">{session.name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {getModeLabel(session.mode)} · {session.teamCount || 0} equipos
        </p>
        <p className="mt-2 font-mono text-lg font-bold text-[#e94560]">
          {session.code}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          onClick={() => navigate(`/spectator/${session.code}`)}
        >
          👀 Ver como espectador
        </Button>

        <Button
          variant="secondary"
          onClick={() => navigate('/join', { state: { prefillCode: session.code } })}
        >
          👥 Crear equipo
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate('/referee')}
        >
          ⚖️ Panel de árbitro
        </Button>
      </div>

      <p className="text-center text-xs text-gray-500">
        Para acceder como árbitro necesitas el código de 4 dígitos del organizador
      </p>
    </div>
  )
}
