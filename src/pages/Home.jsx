import { useNavigate } from 'react-router-dom'
import { useSessionContext } from '../contexts/SessionContext'
import Button from '../components/common/Button'

export default function Home() {
  const navigate = useNavigate()
  const { sessionId, sessionData, clearSession } = useSessionContext()

  return (
    <div className="flex flex-col items-center justify-center gap-8 pt-12">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight text-white">
          Fair<span className="text-[#e94560]">Game</span>
        </h1>
        <p className="mt-2 text-sm text-gray-400">Torneos deportivos justos para todos</p>
      </div>

      {sessionId && sessionData && (
        <div className="w-full rounded-2xl border border-[#e94560]/30 bg-[#e94560]/10 p-4">
          <p className="text-sm text-gray-400">Sesión activa</p>
          <p className="text-lg font-bold text-white">{sessionData.name}</p>
          <p className="text-xs text-gray-500">Código: {sessionData.code}</p>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" className="flex-1 text-sm" onClick={() => navigate(`/referee?session=${sessionData.code}`)}>
              Panel árbitro
            </Button>
            <Button variant="outline" className="flex-1 text-sm" onClick={clearSession}>
              Cerrar
            </Button>
          </div>
        </div>
      )}

      <div className="flex w-full flex-col gap-4">
        <Button onClick={() => navigate('/sessions')}>
          🏆 Ver campeonatos activos
        </Button>
        <Button variant="secondary" onClick={() => navigate('/create')}>
          🎮 Crear campeonato
        </Button>
        <Button variant="outline" onClick={() => navigate('/rules')}>
          📋 Ver reglas
        </Button>
      </div>
    </div>
  )
}
