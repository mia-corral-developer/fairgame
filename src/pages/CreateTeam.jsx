import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTeam } from '../services/sessionService'
import { useSessionContext } from '../contexts/SessionContext'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import FlagSelector from '../components/common/FlagSelector'

export default function CreateTeam() {
  const navigate = useNavigate()
  const { sessionId, setTeam, sessionData, teams } = useSessionContext()
  const [flag, setFlag] = useState('🏳️')
  const [teamName, setTeamName] = useState('')
  const [players, setPlayers] = useState([
    { name: '', phone: '', isCaptain: false },
    { name: '', phone: '', isCaptain: false },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isRoundRobin = sessionData?.mode === 'round-robin'
  const teamCount = teams?.length || 0
  const remainingSlots = isRoundRobin ? Math.max(0, 4 - teamCount) : null

  function addPlayer() {
    if (players.length >= 12) return
    setPlayers([...players, { name: '', phone: '', isCaptain: false }])
  }

  function updatePlayer(index, field, value) {
    const next = [...players]
    next[index] = { ...next[index], [field]: value }
    setPlayers(next)
  }

  function setCaptain(index) {
    const next = players.map((p, i) => ({
      ...p,
      isCaptain: i === index,
    }))
    setPlayers(next)
  }

  function removePlayer(index) {
    if (players.length <= 2) return
    setPlayers(players.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!teamName.trim()) {
      setError('Ingresa el nombre del equipo')
      return
    }

    const validPlayers = players.filter((p) => p.name.trim())
    if (validPlayers.length < 2) {
      setError('Mínimo 2 jugadores')
      return
    }

    const captain = validPlayers.find((p) => p.isCaptain)
    if (!captain) {
      setError('Debes seleccionar un capitán')
      return
    }

    if (!sessionId) {
      setError('No hay sesión activa. Crea o únete a una primero.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const fullName = flag === '🏳️' ? teamName.trim() : `${flag} ${teamName.trim()}`
      const { teamId, pin } = await createTeam({
        sessionId,
        name: fullName,
        players: validPlayers,
      })

      setTeam(teamId)
      navigate('/team-edit', { state: { pin, teamName: fullName, isNew: true } })
    } catch (err) {
      setError(err?.message || 'Error al crear el equipo. Intenta de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isFull = isRoundRobin && remainingSlots === 0

  return (
    <div className="flex flex-col gap-6 pt-4">
      <button
        onClick={() => navigate('/')}
        className="self-start text-sm text-gray-400 hover:text-white cursor-pointer"
      >
        ← Volver
      </button>

      <h2 className="text-2xl font-bold text-white">Crear equipo</h2>

      {isRoundRobin && (
        <div className={`rounded-xl border p-4 text-sm ${
          isFull
            ? 'border-red-500/30 bg-red-500/10 text-red-400'
            : 'border-[#e94560]/20 bg-[#e94560]/10 text-gray-300'
        }`}>
          <p className="font-semibold">
            {isFull
              ? '⚠️ Equipos completos'
              : `🏆 Modo Todos contra todos · ${remainingSlots} cupo${remainingSlots !== 1 ? 's' : ''} disponible${remainingSlots !== 1 ? 's' : ''}`
            }
          </p>
          {!isFull && (
            <p className="text-xs text-gray-400 mt-1">
              {teamCount}/4 equipos registrados
            </p>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">Bandera</label>
        <FlagSelector value={flag} onChange={setFlag} />
      </div>

      <Input
        label="Nombre del equipo"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        placeholder="Ej: Los Campeones"
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">
            Jugadores ({players.length})
          </span>
          <button
            onClick={addPlayer}
            className="text-sm text-[#e94560] hover:underline cursor-pointer"
          >
            + Agregar
          </button>
        </div>

        {players.map((player, index) => (
          <div
            key={index}
            className={`rounded-xl border p-3 ${
              player.isCaptain
                ? 'border-[#e94560]/50 bg-[#e94560]/10'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 w-6">#{index + 1}</span>
              <Input
                value={player.name}
                onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                placeholder="Nombre del jugador"
                className="flex-1"
              />
              {players.length > 2 && (
                <button
                  onClick={() => removePlayer(index)}
                  className="shrink-0 rounded-lg bg-white/10 px-2 py-2 text-xs text-gray-400 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-6" />
              <Input
                value={player.phone}
                onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
                placeholder="Número de contacto"
                className="flex-1"
                type="tel"
              />
              <label className="flex items-center gap-1 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={player.isCaptain}
                  onChange={() => setCaptain(index)}
                  className="accent-[#e94560] h-4 w-4"
                />
                <span className="text-xs text-gray-400">Capitán</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button onClick={handleSave} disabled={loading || isFull}>
        {loading ? 'Guardando...' : isFull ? 'Equipos completos' : 'Guardar equipo'}
      </Button>
    </div>
  )
}
