import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  subscribeToSession,
  subscribeToTeams,
  subscribeToCurrentMatch,
  getSessionByCode,
} from '../services/sessionService'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

export default function SpectatorView() {
  const navigate = useNavigate()
  const { code: urlCode } = useParams()
  const [inputCode, setInputCode] = useState('')
  const [code, setCode] = useState(urlCode || '')
  const [session, setSession] = useState(null)
  const [match, setMatch] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedTeam, setSelectedTeam] = useState(null)

  // Load session and teams
  useEffect(() => {
    let unsubSession = () => {}
    let unsubTeams = () => {}

    async function init() {
      if (!code) {
        setSession(null)
        setTeams([])
        return
      }

      setLoading(true)
      setError('')

      try {
        const sessionData = await getSessionByCode(code.toUpperCase())
        if (!sessionData) {
          setError('Sesión no encontrada')
          setLoading(false)
          return
        }

        setSession(sessionData)
        unsubSession = subscribeToSession(sessionData.id, (data) => {
          setSession(data)
        })
        unsubTeams = subscribeToTeams(sessionData.id, (teamsList) => {
          setTeams(teamsList)
          setLoading(false)
        })
      } catch (err) {
        setError('Error al cargar la sesión')
        setLoading(false)
      }
    }

    init()
    return () => {
      unsubSession()
      unsubTeams()
    }
  }, [code])

  // Subscribe to current match (separate from session)
  useEffect(() => {
    if (!session?.id) return

    const unsub = subscribeToCurrentMatch(session.id, (currentMatch) => {
      setMatch(currentMatch)
    })

    return () => unsub()
  }, [session?.id])

  async function handleJoin() {
    if (!inputCode.trim()) {
      setError('Ingresa el código de sesión')
      return
    }
    const upperCode = inputCode.trim().toUpperCase()
    setCode(upperCode)
    navigate(`/spectator/${upperCode}`, { replace: true })
  }

  function getTeamName(teamId) {
    return teams.find((t) => t.id === teamId)?.name || 'Equipo'
  }

  // Calculate next match teams
  const playingTeams = match ? [match.teamA, match.teamB] : []
  const remainingQueue = session?.queue?.filter((id) => !playingTeams.includes(id)) || []
  const nextTeamA = remainingQueue[0]
  const nextTeamB = remainingQueue[1]

  // Pantalla para ingresar código
  if (!code) {
    return (
      <div className="flex flex-col gap-6 pt-4">
        <button onClick={() => navigate('/')} className="self-start text-sm text-gray-400 hover:text-white cursor-pointer">
          ← Volver
        </button>

        <h2 className="text-2xl font-bold text-white">Ver como espectador</h2>

        <p className="text-sm text-gray-400">
          Ingresa el código de la sesión para ver el torneo en tiempo real.
        </p>

        <Input
          label="Código de sesión"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
          placeholder="Ej: ABC123"
          maxLength={6}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button onClick={handleJoin}>Ver torneo</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e94560] border-t-transparent" />
        <p className="text-sm text-gray-400">Cargando sesión...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 pt-12">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => {
            setCode('')
            setError('')
            setInputCode('')
            navigate('/spectator')
          }}
          className="text-sm text-gray-400 hover:text-white cursor-pointer"
        >
          ← Intentar con otro código
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white cursor-pointer">
          ← Salir
        </button>
        <span className="text-xs text-gray-500">Código: {code}</span>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">{session?.name}</h2>
        <p className="text-sm text-gray-500">
          {session?.mode === 'queue' ? 'Cola clásica' : 'Todos contra todos'} · {teams.length} equipos
        </p>
      </div>

      {/* Current Match */}
      {match && (
        <div className="rounded-2xl border border-[#e94560]/30 bg-[#e94560]/10 p-6">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-[#e94560]">
            {match.status === 'finished' ? '🏆 Partido terminado' : 'Partido en curso'}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-white">{getTeamName(match.teamA)}</p>
              <p className="text-3xl font-black text-white">{match.scoreA || 0}</p>
            </div>
            <div className="px-4 text-sm text-gray-500">vs</div>
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-[#e94560]">{getTeamName(match.teamB)}</p>
              <p className="text-3xl font-black text-[#e94560]">{match.scoreB || 0}</p>
            </div>
          </div>
          {match.status === 'finished' && match.winner && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">Ganador</p>
              <p className="text-xl font-bold text-[#e94560]">{getTeamName(match.winner)}</p>
            </div>
          )}
        </div>
      )}

      {/* Next Match Preview - only meaningful in round-robin mode */}
      {session?.mode === 'round-robin' && (nextTeamA || nextTeamB) && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            👁️ Próximo partido
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm font-bold text-white">{getTeamName(nextTeamA) || '---'}</span>
            <span className="text-xs text-gray-500">vs</span>
            <span className="text-sm font-bold text-[#e94560]">{getTeamName(nextTeamB) || '---'}</span>
          </div>
        </div>
      )}

      {/* Queue */}
      {session?.mode === 'queue' && session.queue?.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-3 font-semibold text-gray-300">Cola de espera</h3>
          <ol className="flex flex-col gap-2">
            {session.queue.map((teamId, i) => (
              <li key={teamId} className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-6 text-center text-xs text-gray-600">{i + 1}</span>
                {getTeamName(teamId)}
                {i === 0 && match?.status === 'playing' && (
                  <span className="text-xs text-[#e94560]">● Jugando</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Standings */}
      {session?.mode === 'round-robin' && teams.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-3 font-semibold text-gray-300">Tabla de posiciones</h3>
          <div className="flex flex-col gap-2">
            {[...teams]
              .sort((a, b) => (b.wins || 0) - (a.wins || 0) || (b.totalPoints || 0) - (a.totalPoints || 0))
              .map((team, i) => (
                <div key={team.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs text-gray-500">{i + 1}</span>
                    <span className="text-sm text-white">{team.name}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>{team.wins || 0}V</span>
                    <span>{team.losses || 0}D</span>
                    <span className="text-[#e94560]">{team.totalPoints || 0}pts</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Teams */}
      {selectedTeam ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <button
            onClick={() => setSelectedTeam(null)}
            className="mb-4 text-sm text-gray-400 hover:text-white cursor-pointer"
          >
            ← Volver a equipos
          </button>
          <h3 className="mb-1 text-xl font-bold text-white">{selectedTeam.name}</h3>
          <p className="mb-4 text-xs text-gray-500">{selectedTeam.city} · Capitán: {selectedTeam.captain || 'No definido'}</p>

          <div className="flex flex-col gap-2">
            {selectedTeam.players?.map((player, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#{i + 1}</span>
                  <span className="text-sm text-white">{player.name}</span>
                  {player.isCaptain && (
                    <span className="rounded bg-[#e94560]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#e94560]">⭐ CAPITÁN</span>
                  )}
                </div>
                {player.phone && (
                  <span className="text-xs text-gray-500">{player.phone}</span>
                )}
              </div>
            )) || <p className="text-sm text-gray-500">Sin jugadores registrados</p>}
          </div>

          <Button
            onClick={() => navigate('/edit-team', { state: { sessionId: session.id, teamId: selectedTeam.id } })}
            variant="secondary"
            className="mt-4 w-full"
          >
            ✏️ Editar equipo
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-3 font-semibold text-gray-300">Equipos</h3>
          <div className="flex flex-col gap-2">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className="text-left rounded-lg bg-white/5 px-3 py-3 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <p className="text-sm font-medium text-white">{team.name}</p>
                <p className="text-xs text-gray-500">{team.players?.length || 0} jugadores · {team.city}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
