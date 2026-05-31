import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSessionContext } from '../contexts/SessionContext'
import { validateTeamPin, updateTeam, penalizeTeamEdit, getSession, getTeam } from '../services/sessionService'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

export default function EditTeam() {
  const navigate = useNavigate()
  const location = useLocation()
  const context = useSessionContext()

  // Support both context and direct navigation (e.g. from spectator view)
  const locationState = location.state || {}
  const sessionId = context.sessionId || locationState.sessionId
  const teamId = context.teamId || locationState.teamId

  const [team, setTeam] = useState(null)
  const [sessionData, setSessionData] = useState(context.sessionData || null)
  const [dataLoading, setDataLoading] = useState(false)

  const [step, setStep] = useState('pin')
  const [pin, setPin] = useState('')
  const [teamName, setTeamName] = useState('')
  const [players, setPlayers] = useState([
    { name: '', phone: '', isCaptain: false },
    { name: '', phone: '', isCaptain: false },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load team and session data if not in context
  useEffect(() => {
    async function loadData() {
      if (!sessionId || !teamId) return
      if (context.teams.length > 0 && context.sessionData) {
        // Use context data
        const ctxTeam = context.teams.find((t) => t.id === teamId)
        if (ctxTeam) setTeam(ctxTeam)
        setSessionData(context.sessionData)
        return
      }
      // Load from Firebase
      setDataLoading(true)
      try {
        const session = await getSession(sessionId)
        if (session) {
          setSessionData(session)
          const t = await getTeam(teamId)
          if (t) setTeam({ ...t, id: teamId })
        }
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [sessionId, teamId, context.teams, context.sessionData])

  async function handleValidatePin() {
    if (!pin.trim() || pin.length !== 4) {
      setError('Ingresa un PIN válido de 4 dígitos')
      return
    }
    setLoading(true)
    setError('')
    try {
      const isValid = await validateTeamPin(sessionId, teamId, pin)
      if (!isValid) {
        setError('PIN incorrecto')
        setLoading(false)
        return
      }
      // Pre-fill with current data
      const currentTeam = team || context.teams.find((t) => t.id === teamId)
      if (currentTeam) {
        setTeamName(currentTeam.name || '')
        if (currentTeam.players?.length >= 2) {
          setPlayers(
            currentTeam.players.map((p) =>
              typeof p === 'string'
                ? { name: p, phone: '', isCaptain: false }
                : { name: p.name || '', phone: p.phone || '', isCaptain: p.isCaptain || false }
            )
          )
        }
      }
      setStep('edit')
    } catch (err) {
      setError('Error al validar PIN')
    } finally {
      setLoading(false)
    }
  }

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
    const next = players.map((p, i) => ({ ...p, isCaptain: i === index }))
    setPlayers(next)
  }

  function removePlayer(index) {
    if (players.length <= 2) return
    const next = players.filter((_, i) => i !== index)
    setPlayers(next)
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
    const captainCount = validPlayers.filter((p) => p.isCaptain).length
    if (captainCount !== 1) {
      setError('Debes seleccionar exactamente 1 capitán')
      return
    }

    setLoading(true)
    setError('')

    try {
      const captainName = validPlayers.find((p) => p.isCaptain)?.name || ''
      await updateTeam(sessionId, teamId, {
        name: teamName.trim(),
        players: validPlayers,
        captain: captainName,
      })

      // Penalize in queue mode
      if (sessionData?.mode === 'queue') {
        await penalizeTeamEdit(sessionId, teamId)
      }

      setStep('done')
    } catch (err) {
      setError(err?.message || 'Error al guardar cambios')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!sessionId || !teamId) {
    return (
      <div className="flex flex-col items-center gap-4 pt-12">
        <p className="text-red-400">No se encontró información del equipo</p>
        <Button onClick={() => navigate('/')} variant="secondary">
          Volver al inicio
        </Button>
      </div>
    )
  }

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e94560] border-t-transparent" />
        <p className="text-sm text-gray-400">Cargando...</p>
      </div>
    )
  }

  // Step 1: Enter PIN
  if (step === 'pin') {
    return (
      <div className="flex flex-col gap-6 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="self-start text-sm text-gray-400 hover:text-white cursor-pointer"
        >
          ← Volver
        </button>

        <h2 className="text-2xl font-bold text-white">🔐 Verificar acceso</h2>

        <p className="text-sm text-gray-400">
          Ingresa el PIN de 4 dígitos del equipo <strong>{team?.name || ''}</strong> para editarlo.
        </p>

        <Input
          label="PIN del equipo"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="Ej: 1234"
          maxLength={4}
          type="password"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button onClick={handleValidatePin} disabled={loading}>
          {loading ? 'Verificando...' : 'Verificar'}
        </Button>
      </div>
    )
  }

  // Step 2: Edit form
  if (step === 'edit') {
    return (
      <div className="flex flex-col gap-6 pt-4">
        <button
          onClick={() => setStep('pin')}
          className="self-start text-sm text-gray-400 hover:text-white cursor-pointer"
        >
          ← Volver
        </button>

        <h2 className="text-2xl font-bold text-white">✏️ Editar equipo</h2>

        {sessionData?.mode === 'queue' && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-xs text-red-200">
              ⚠️ Al guardar, tu equipo irá al <strong>final de la cola</strong> como penalización.
            </p>
          </div>
        )}

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
            <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">#{index + 1}</span>
                {player.isCaptain && (
                  <span className="rounded bg-[#e94560]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#e94560]">
                    ⭐ CAPITÁN
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  value={player.name}
                  onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                  placeholder="Nombre del jugador"
                  className="flex-1"
                />
                <div className="flex items-center gap-2">
                  <Input
                    value={player.phone}
                    onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
                    placeholder="Número de contacto"
                    className="flex-1"
                  />
                  <button
                    onClick={() => setCaptain(index)}
                    className={`shrink-0 rounded-xl px-3 py-3 text-sm cursor-pointer transition-colors ${
                      player.isCaptain
                        ? 'bg-[#e94560]/20 text-[#e94560]'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                    title="Marcar como capitán"
                  >
                    ⭐
                  </button>
                  {players.length > 2 && (
                    <button
                      onClick={() => removePlayer(index)}
                      className="shrink-0 rounded-xl bg-white/10 px-3 py-3 text-sm text-gray-400 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : '💾 Guardar cambios'}
        </Button>
      </div>
    )
  }

  // Step 3: Done
  return (
    <div className="flex flex-col items-center gap-6 pt-12">
      <div className="text-5xl">✅</div>
      <h2 className="text-2xl font-bold text-white">Cambios guardados</h2>

      {sessionData?.mode === 'queue' && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-center">
          <p className="text-sm text-yellow-200">
            Tu equipo fue movido al <strong>final de la cola</strong> por la edición.
          </p>
        </div>
      )}

      <Button onClick={() => navigate(-1)} variant="secondary">
        Volver
      </Button>
    </div>
  )
}
