import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession } from '../services/sessionService'
import { useSessionContext } from '../contexts/SessionContext'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

export default function CreateSession() {
  const navigate = useNavigate()
  const { joinSession, setReferee } = useSessionContext()
  const [name, setName] = useState('')
  const [mode, setMode] = useState('queue')
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
      const { sessionId, code, refereeCode } = await createSession({ name, mode })
      joinSession(sessionId)
      setReferee(true)
      navigate('/share', { state: { code, name, mode, refereeCode } })
    } catch (err) {
      setError('Error al crear la sesión. Intenta de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button onClick={handleCreate} disabled={loading}>
        {loading ? 'Creando...' : 'Crear y continuar'}
      </Button>
    </div>
  )
}
