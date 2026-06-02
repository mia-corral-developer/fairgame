import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession } from '../services/sessionService'
import { useSessionContext } from '../contexts/SessionContext'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

const SETS_OPTIONS = [
  { value: 1, label: '1 set' },
  { value: 2, label: 'Mejor de 3' },
  { value: 3, label: 'Mejor de 5' },
]

const POINTS_OPTIONS = [15, 21, 25, 30]

export default function CreateSession() {
  const navigate = useNavigate()
  const { joinSession, setReferee } = useSessionContext()
  const [name, setName] = useState('')
  const [mode, setMode] = useState('queue')
  const [setsToWin, setSetsToWin] = useState(1)
  const [pointsPerSet, setPointsPerSet] = useState(25)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) {
      setError('Ingresa un nombre para el campeonato')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { sessionId, code, refereeCode } = await createSession({ name, mode, setsToWin, pointsPerSet })
      joinSession(sessionId)
      setReferee(true)
      navigate('/share', { state: { code, name, mode, refereeCode, setsToWin, pointsPerSet } })
    } catch (err) {
      setError('Error al crear la sesión. Intenta de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const setsLabel = setsToWin === 1 ? '1 set' : `Mejor de ${setsToWin * 2 - 1} (ganar ${setsToWin})`

  return (
    <div className="flex flex-col gap-6 pt-4">
      <button onClick={() => navigate('/')} className="self-start text-sm text-gray-400 hover:text-white cursor-pointer">
        ← Volver
      </button>

      <h2 className="text-2xl font-bold text-white">Crear campeonato</h2>

      <Input
        label="Nombre del campeonato"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Liga de Verano"
      />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-300">Modo de juego</span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560]/50"
        >
          <option value="queue" className="bg-[#1a1a2e]">Cola clásica</option>
          <option value="round-robin" className="bg-[#1a1a2e]">Todos contra todos</option>
        </select>
      </label>

      {/* Sets por partido */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-300">Sets por partido</span>
        <div className="grid grid-cols-3 gap-2">
          {SETS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSetsToWin(opt.value)}
              className={`rounded-xl py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                setsToWin === opt.value
                  ? 'bg-[#e94560] text-white'
                  : 'border border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Puntos por set */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-300">Puntos por set</span>
        <div className="grid grid-cols-4 gap-2">
          {POINTS_OPTIONS.map((pts) => (
            <button
              key={pts}
              onClick={() => setPointsPerSet(pts)}
              className={`rounded-xl py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                pointsPerSet === pts
                  ? 'bg-[#e94560] text-white'
                  : 'border border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
              }`}
            >
              {pts}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen de configuración */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
        <p className="font-medium text-white mb-1">Configuración del partido</p>
        <p>• {setsLabel}</p>
        <p>• {pointsPerSet} puntos para ganar cada set</p>
        {mode === 'round-robin' && (
          <>
            <p>• Fase de grupos: todos vs todos</p>
            <p>• Clasifican los 4 mejores → Semifinales → Final</p>
          </>
        )}
        {mode === 'queue' && (
          <p>• El ganador se queda, el perdedor va al final de la cola</p>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button onClick={handleCreate} disabled={loading}>
        {loading ? 'Creando...' : 'Crear y continuar'}
      </Button>
    </div>
  )
}
