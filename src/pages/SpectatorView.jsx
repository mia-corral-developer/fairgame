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

  const isTournament = session?.mode === 'round-robin'
  const phase = session?.phase || 'group'

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
    const team = teams.find((t) => t.id === teamId)
    if (!team) return 'Equipo'
    return team.flag ? `${team.flag} ${team.name}` : team.name
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
        {isTournament && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#e94560]/20 px-3 py-1 text-xs font-bold text-[#e94560]">
            {phase === 'group' && '🔥 Fase de grupos'}
            {phase === 'semifinals' && '⚔️ Semifinales'}
            {phase === 'final' && '🏆 Final'}
            {phase === 'completed' && '🏅 Torneo completado'}
          </div>
        )}
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

      {/* Tournament Standings */}
      {isTournament && phase === 'group' && teams.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            📊 Tabla de posiciones
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <div className="grid grid-cols-5 gap-2 text-xs text-gray-500">
              <span>Equipo</span>
              <span className="text-center">PJ</span>
              <span className="text-center">PG</span>
              <span className="text-center">PF</span>
              <span className="text-center">Diff</span>
            </div>
            {(() => {
              const standingsData = teams.map((t) => {
                const s = session?.standings?.[t.id] || { wins: 0, played: 0, pointsFor: 0, pointsAgainst: 0 }
                return { teamId: t.id, name: getTeamName(t.id), wins: s.wins || 0, played: s.played || 0, pointsFor: s.pointsFor || 0, diff: (s.pointsFor || 0) - (s.pointsAgainst || 0) }
              }).sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.pointsFor - a.pointsFor)

              const hasResults = standingsData.some((s) => s.played > 0)
              const showCut = teams.length > 4 && hasResults

              return standingsData.flatMap((s, i) => {
                const items = []
                if (showCut && i === 4) {
                  items.push(
                    <div key="cut" className="flex items-center gap-2 my-1">
                      <div className="flex-1 h-px bg-[#e94560]/50" />
                      <span className="text-[10px] font-bold text-[#e94560] tracking-wider">ELIMINADOS</span>
                      <div className="flex-1 h-px bg-[#e94560]/50" />
                    </div>
                  )
                }
                items.push(
                  <div key={s.teamId} className={`grid grid-cols-5 gap-2 rounded-lg p-2 ${!showCut || i < 4 ? 'bg-[#e94560]/10 border border-[#e94560]/20' : 'bg-white/5 opacity-50'}`}>
                    <span className="font-semibold text-white truncate">{s.name}</span>
                    <span className="text-center text-gray-400">{s.played}</span>
                    <span className="text-center text-[#e94560]">{s.wins}</span>
                    <span className="text-center text-gray-400">{s.pointsFor}</span>
                    <span className="text-center text-gray-400">{s.diff > 0 ? `+${s.diff}` : s.diff}</span>
                  </div>
                )
                return items
              })
            })()}
          </div>
        </div>
      )}

      {/* Group Stage Fixture — by jornada */}
      {isTournament && phase === 'group' && session?.groupMatches && (
        (() => {
          const matchesPerRound = teams.length > 0 ? Math.floor(teams.length / 2) : 2
          const sortedMatches = Object.values(session.groupMatches).sort((a, b) => (a.id || '').localeCompare(b.id || ''))
          const groupByes = session.groupByes || {}
          const rounds = sortedMatches.reduce((acc, m, i) => {
            const r = m.round ?? (Math.floor(i / matchesPerRound) + 1)
            if (!acc[r]) acc[r] = []
            acc[r].push(m)
            return acc
          }, {})

          return (
            <div className="flex flex-col gap-3">
              {Object.entries(rounds).map(([round, rMatches]) => (
                <div key={round} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Jornada {round}
                  </p>
                  <div className="flex flex-col gap-2">
                    {rMatches.map((m) => (
                      <div key={m.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                        m.status === 'playing' ? 'bg-[#e94560]/10 border border-[#e94560]/30' :
                        m.status === 'finished' ? 'opacity-50' : 'bg-white/5'
                      }`}>
                        <span className={`flex-1 text-right font-medium ${m.status === 'finished' && m.winner === m.teamA ? 'text-white' : 'text-gray-400'}`}>
                          {getTeamName(m.teamA)}
                        </span>
                        <span className="text-xs text-gray-500 w-10 text-center">
                          {m.status === 'finished' ? `${m.scoreA}-${m.scoreB}` : 'vs'}
                        </span>
                        <span className={`flex-1 font-medium ${m.status === 'finished' && m.winner === m.teamB ? 'text-white' : 'text-gray-400'}`}>
                          {getTeamName(m.teamB)}
                        </span>
                        {m.status === 'playing' && <span className="text-xs text-[#e94560] animate-pulse">●</span>}
                      </div>
                    ))}
                    {groupByes[round] && (
                      <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-white/5 text-gray-500">
                        <span>😴</span>
                        <span>{getTeamName(groupByes[round])} descansa</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })()
      )}

      {/* Knockout Bracket */}
      {isTournament && (phase === 'semifinals' || phase === 'final' || phase === 'completed') && session?.bracket && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            🏆 Eliminatorias
          </p>
          <div className="flex flex-col gap-3">
            {session.bracket.semifinal1 && (
              <div className={`rounded-lg p-3 ${session.bracket.semifinal1.status === 'finished' ? 'bg-[#e94560]/10 border border-[#e94560]/20' : 'bg-white/5'}`}>
                <p className="text-xs text-gray-500 mb-1">Semifinal 1</p>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${session.bracket.semifinal1.winner === session.bracket.semifinal1.teamA ? 'text-white' : 'text-gray-400'}`}>
                    {getTeamName(session.bracket.semifinal1.teamA)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {session.bracket.semifinal1.status === 'finished' ? `${session.bracket.semifinal1.scoreA}-${session.bracket.semifinal1.scoreB}` : 'vs'}
                  </span>
                  <span className={`font-semibold ${session.bracket.semifinal1.winner === session.bracket.semifinal1.teamB ? 'text-white' : 'text-gray-400'}`}>
                    {getTeamName(session.bracket.semifinal1.teamB)}
                  </span>
                </div>
                {session.bracket.semifinal1.status === 'finished' && (
                  <p className="mt-1 text-xs text-[#e94560]">Ganador: {getTeamName(session.bracket.semifinal1.winner)}</p>
                )}
              </div>
            )}
            {session.bracket.semifinal2 && (
              <div className={`rounded-lg p-3 ${session.bracket.semifinal2.status === 'finished' ? 'bg-[#e94560]/10 border border-[#e94560]/20' : 'bg-white/5'}`}>
                <p className="text-xs text-gray-500 mb-1">Semifinal 2</p>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${session.bracket.semifinal2.winner === session.bracket.semifinal2.teamA ? 'text-white' : 'text-gray-400'}`}>
                    {getTeamName(session.bracket.semifinal2.teamA)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {session.bracket.semifinal2.status === 'finished' ? `${session.bracket.semifinal2.scoreA}-${session.bracket.semifinal2.scoreB}` : 'vs'}
                  </span>
                  <span className={`font-semibold ${session.bracket.semifinal2.winner === session.bracket.semifinal2.teamB ? 'text-white' : 'text-gray-400'}`}>
                    {getTeamName(session.bracket.semifinal2.teamB)}
                  </span>
                </div>
                {session.bracket.semifinal2.status === 'finished' && (
                  <p className="mt-1 text-xs text-[#e94560]">Ganador: {getTeamName(session.bracket.semifinal2.winner)}</p>
                )}
              </div>
            )}
            {session.bracket.final && (
              <div className={`rounded-lg p-3 ${session.bracket.final.status === 'finished' ? 'bg-[#e94560]/10 border border-[#e94560]/20' : 'bg-white/5'}`}>
                <p className="text-xs text-gray-500 mb-1">Final</p>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${session.bracket.final.winner === session.bracket.final.teamA ? 'text-white' : 'text-gray-400'}`}>
                    {getTeamName(session.bracket.final.teamA)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {session.bracket.final.status === 'finished' ? `${session.bracket.final.scoreA}-${session.bracket.final.scoreB}` : 'vs'}
                  </span>
                  <span className={`font-semibold ${session.bracket.final.winner === session.bracket.final.teamB ? 'text-white' : 'text-gray-400'}`}>
                    {getTeamName(session.bracket.final.teamB)}
                  </span>
                </div>
                {session.bracket.final.status === 'finished' && (
                  <p className="mt-1 text-xs text-[#e94560]">Ganador: {getTeamName(session.bracket.final.winner)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Champion */}
      {isTournament && phase === 'completed' && session?.champion && (
        <div className="rounded-2xl border border-[#e94560]/30 bg-[#e94560]/10 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#e94560]">
            🏆 Campeón del torneo
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {getTeamName(session.champion)}
          </p>
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
          <h3 className="mb-1 text-xl font-bold text-white">{selectedTeam.flag ? `${selectedTeam.flag} ${selectedTeam.name}` : selectedTeam.name}</h3>
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
                <p className="text-sm font-medium text-white">{team.flag ? `${team.flag} ${team.name}` : team.name}</p>
                <p className="text-xs text-gray-500">{team.players?.length || 0} jugadores · {team.city}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
