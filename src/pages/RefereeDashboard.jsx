import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  getNextMatchTeams,
  createMatch,
  finishMatch,
  updateMatchScore,
  rotateQueue,
  subscribeToCurrentMatch,
  clearCurrentMatch,
  getSessionByCode,
  subscribeToSession,
  subscribeToTeams,
  initGroupMatches,
  getNextTournamentMatch,
  createTournamentMatch,
  finishGroupMatch,
  finishKnockoutMatch,
  shuffleGroupMatches,
} from '../services/sessionService'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

export default function RefereeDashboard() {
  const navigate = useNavigate()
  const location = useLocation()

  const [sessionCode, setSessionCode] = useState('')
  const [refereeCode, setRefereeCode] = useState('')
  const [verifiedSession, setVerifiedSession] = useState(null)
  const [sessionData, setSessionData] = useState(null)
  const [teams, setTeams] = useState([])
  const [match, setMatch] = useState(null)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [hasPrefilledSession, setHasPrefilledSession] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const sessionFromUrl = params.get('session')
    if (sessionFromUrl) {
      setSessionCode(sessionFromUrl.toUpperCase())
      setHasPrefilledSession(true)
    }

    const stored = sessionStorage.getItem('referee_session')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setVerifiedSession(parsed)
        setSessionCode(parsed.sessionCode)
      } catch {
        sessionStorage.removeItem('referee_session')
      }
    }
  }, [])

  useEffect(() => {
    if (!verifiedSession?.sessionId) return
    let unsubSession = () => {}
    let unsubTeams = () => {}
    let unsubMatch = () => {}

    unsubSession = subscribeToSession(verifiedSession.sessionId, (data) => {
      setSessionData(data)
    })
    unsubTeams = subscribeToTeams(verifiedSession.sessionId, (list) => {
      setTeams(list)
    })
    unsubMatch = subscribeToCurrentMatch(verifiedSession.sessionId, (currentMatch) => {
      setMatch(currentMatch)
      if (currentMatch) {
        setScoreA(currentMatch.scoreA || 0)
        setScoreB(currentMatch.scoreB || 0)
      } else {
        setScoreA(0)
        setScoreB(0)
      }
      setProcessing(false)
    })

    return () => {
      unsubSession()
      unsubTeams()
      unsubMatch()
    }
  }, [verifiedSession])

  async function handleVerify() {
    if (!sessionCode.trim() || !refereeCode.trim() || refereeCode.length !== 4) {
      setError('Ingresa código de sesión y código de árbitro de 4 dígitos')
      return
    }
    setLoading(true)
    setError('')
    try {
      const session = await getSessionByCode(sessionCode.toUpperCase())
      if (!session) {
        setError('Sesión no encontrada')
        setLoading(false)
        return
      }
      if (session.refereeCode !== refereeCode) {
        setError('Código de árbitro incorrecto')
        setLoading(false)
        return
      }
      const verified = {
        sessionId: session.id,
        sessionCode: sessionCode.toUpperCase(),
        refereeCode,
      }
      sessionStorage.setItem('referee_session', JSON.stringify(verified))
      setVerifiedSession(verified)
    } catch (err) {
      setError('Error al verificar')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('referee_session')
    setVerifiedSession(null)
    setSessionCode('')
    setRefereeCode('')
    setSessionData(null)
    setTeams([])
    setMatch(null)
  }

  async function startMatch() {
    if (!verifiedSession?.sessionId || processing) return
    setProcessing(true)
    setError('')

    try {
      const isTournament = sessionData?.mode === 'round-robin'

      if (isTournament) {
        await initGroupMatches(verifiedSession.sessionId)

        const next = await getNextTournamentMatch(verifiedSession.sessionId)
        if (!next) {
          setError('No hay más partidos programados en esta fase')
          setProcessing(false)
          return
        }

        await createTournamentMatch({
          sessionId: verifiedSession.sessionId,
          matchId: next.matchId,
          teamA: next.teamA,
          teamB: next.teamB,
        })
      } else {
        const next = await getNextMatchTeams(verifiedSession.sessionId)
        if (!next) {
          setError('Se necesitan al menos 2 equipos para iniciar')
          setProcessing(false)
          return
        }
        await createMatch({
          sessionId: verifiedSession.sessionId,
          teamA: next.teamA,
          teamB: next.teamB,
        })
      }
    } catch (err) {
      setError('Error al iniciar partido')
      console.error(err)
      setProcessing(false)
    }
  }

  async function addPoint(team) {
    if (!match || match.status !== 'playing' || processing) return

    const newScoreA = team === 'A' ? scoreA + 1 : scoreA
    const newScoreB = team === 'B' ? scoreB + 1 : scoreB

    setScoreA(newScoreA)
    setScoreB(newScoreB)

    const pointsToWin = sessionData?.pointsToWin || 15
    const isWin = newScoreA >= pointsToWin || newScoreB >= pointsToWin

    if (isWin) {
      setProcessing(true)
    }

    try {
      await updateMatchScore(verifiedSession.sessionId, match.id, {
        scoreA: newScoreA,
        scoreB: newScoreB,
      })

      if (isWin) {
        const winner = newScoreA > newScoreB ? match.teamA : match.teamB
        const loser = winner === match.teamA ? match.teamB : match.teamA
        const isTournament = sessionData?.mode === 'round-robin'
        const phase = sessionData?.phase

        if (isTournament) {
          if (phase === 'group') {
            await finishGroupMatch(
              verifiedSession.sessionId,
              match.id,
              winner,
              newScoreA,
              newScoreB
            )
          } else if (phase === 'semifinals' || phase === 'final') {
            await finishKnockoutMatch(
              verifiedSession.sessionId,
              match.id,
              winner,
              newScoreA,
              newScoreB
            )
          }
        } else {
          await finishMatch(verifiedSession.sessionId, match.id, winner)
          await rotateQueue(verifiedSession.sessionId, winner, loser)
        }
      }
    } catch (err) {
      setError('Error al registrar punto')
      console.error(err)
      setProcessing(false)
    }
  }

  async function handleNextMatch() {
    if (!verifiedSession?.sessionId || processing) return
    setProcessing(true)
    setError('')

    try {
      await clearCurrentMatch(verifiedSession.sessionId)
    } catch (err) {
      setError('Error al finalizar partido')
      console.error(err)
      setProcessing(false)
    }
  }

  async function handleShuffleFixture() {
    if (!verifiedSession?.sessionId || processing) return
    setProcessing(true)
    setError('')

    try {
      await shuffleGroupMatches(verifiedSession.sessionId)
    } catch (err) {
      setError(err.message || 'Error al sortear fixture')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  function getTeamName(teamId) {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return 'Equipo'
    return team.flag ? `${team.flag} ${team.name}` : team.name
  }

  const isTournament = sessionData?.mode === 'round-robin'
  const phase = sessionData?.phase || 'group'

  const phaseLabel = {
    group: '🔥 Fase de grupos',
    semifinals: '⚔️ Semifinales',
    final: '🏆 Final',
    completed: '🏅 Torneo completado',
  }

  // Standings for display
  const standings = []
  if (isTournament && sessionData?.standings) {
    teams.forEach((team) => {
      const s = sessionData.standings[team.id] || { wins: 0, played: 0, pointsFor: 0, pointsAgainst: 0 }
      standings.push({
        ...s,
        teamId: team.id,
        teamName: team.name,
        diff: s.pointsFor - s.pointsAgainst,
      })
    })
    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.diff !== a.diff) return b.diff - a.diff
      return b.pointsFor - a.pointsFor
    })
  }

  const bracket = sessionData?.bracket || {}

  const groupMatches = isTournament
    ? Object.values(sessionData?.groupMatches || {}).sort((a, b) => {
        const order = { playing: 0, scheduled: 1, finished: 2 }
        return order[a.status] - order[b.status]
      })
    : []

  // Render login
  if (!verifiedSession) {
    return (
      <div className="flex flex-col gap-6 pt-4">
        <button onClick={() => navigate('/')} className="self-start text-sm text-gray-400 hover:text-white cursor-pointer">
          ← Volver
        </button>
        <h2 className="text-2xl font-bold text-white">🔒 Panel de árbitro</h2>
        <p className="text-sm text-gray-400">Este panel es exclusivo para el organizador del campeonato.</p>
        {hasPrefilledSession && sessionCode && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-xs text-gray-500">Sesión</p>
            <p className="text-lg font-bold text-white tracking-widest">{sessionCode}</p>
          </div>
        )}
        {!hasPrefilledSession && (
          <Input
            label="Código de sesión"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
            placeholder="Ej: ABC123"
            maxLength={6}
          />
        )}
        <Input
          label="Código de árbitro"
          value={refereeCode}
          onChange={(e) => setRefereeCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="Ej: 1234"
          maxLength={4}
          type="password"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button onClick={handleVerify} disabled={loading}>
          {loading ? 'Verificando...' : 'Acceder'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { handleLogout(); navigate('/') }} className="text-sm text-gray-400 hover:text-white cursor-pointer">
          ← Salir
        </button>
        <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 cursor-pointer">
          Cerrar sesión
        </button>
      </div>

      <h2 className="text-2xl font-bold text-white">Panel de árbitro</h2>

      {sessionData && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center space-y-1">
          <p className="text-xs text-gray-500">{sessionData.name}</p>
          <p className="text-xs text-gray-500">Código: {sessionData.code}</p>
          {isTournament && (
            <p className="text-xs font-bold text-[#e94560]">{phaseLabel[phase]}</p>
          )}
        </div>
      )}

      {/* TORNEO COMPLETADO */}
      {isTournament && phase === 'completed' && (
        <div className="rounded-2xl border border-[#e94560]/30 bg-[#e94560]/10 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#e94560]">
            🏆 Torneo completado
          </p>
          <div className="mt-4">
            <p className="text-sm text-gray-400">Campeón</p>
            <p className="text-3xl font-black text-[#e94560]">
              {getTeamName(sessionData?.champion)}
            </p>
          </div>
        </div>
      )}

      {/* NO HAY PARTIDO */}
      {!match ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-gray-400">No hay partido activo</p>
            <p className="mt-1 text-sm text-gray-500">
              {teams.length < 2 ? 'Esperando equipos...' : `${teams.length} equipos listos`}
            </p>
            {isTournament && groupMatches.length > 0 && (
              <p className="mt-2 text-sm text-gray-400">
                {groupMatches.filter((m) => m.status === 'finished').length} / {groupMatches.length} partidos jugados
              </p>
            )}
          </div>

          {/* Standings table (group phase) */}
          {isTournament && phase === 'group' && standings.length > 0 && (
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
                {standings.map((s, i) => (
                  <div key={s.teamId} className={`grid grid-cols-5 gap-2 rounded-lg p-2 ${i < 2 ? 'bg-[#e94560]/10 border border-[#e94560]/20' : 'bg-white/5'}`}>
                    <span className="font-semibold text-white truncate">{s.teamName}</span>
                    <span className="text-center text-gray-400">{s.played}</span>
                    <span className="text-center text-[#e94560]">{s.wins}</span>
                    <span className="text-center text-gray-400">{s.pointsFor}</span>
                    <span className="text-center text-gray-400">
                      {s.diff > 0 ? `+${s.diff}` : s.diff}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Semifinals bracket */}
          {isTournament && phase === 'semifinals' && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                ⚔️ Semifinales
              </p>
              <div className="flex flex-col gap-3">
                {bracket.semifinal1 && (
                  <div className={`rounded-lg p-3 ${bracket.semifinal1.status === 'finished' ? 'bg-[#e94560]/10 border border-[#e94560]/20' : 'bg-white/5'}`}>
                    <p className="text-xs text-gray-500 mb-1">Semifinal 1</p>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${bracket.semifinal1.winner === bracket.semifinal1.teamA ? 'text-white' : 'text-gray-400'}`}>
                        {getTeamName(bracket.semifinal1.teamA)}
                      </span>
                      <span className="text-xs text-gray-500">vs</span>
                      <span className={`font-semibold ${bracket.semifinal1.winner === bracket.semifinal1.teamB ? 'text-white' : 'text-gray-400'}`}>
                        {getTeamName(bracket.semifinal1.teamB)}
                      </span>
                    </div>
                    {bracket.semifinal1.status === 'finished' && (
                      <p className="mt-1 text-xs text-[#e94560]">
                        Ganador: {getTeamName(bracket.semifinal1.winner)}
                      </p>
                    )}
                  </div>
                )}
                {bracket.semifinal2 && (
                  <div className={`rounded-lg p-3 ${bracket.semifinal2.status === 'finished' ? 'bg-[#e94560]/10 border border-[#e94560]/20' : 'bg-white/5'}`}>
                    <p className="text-xs text-gray-500 mb-1">Semifinal 2</p>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${bracket.semifinal2.winner === bracket.semifinal2.teamA ? 'text-white' : 'text-gray-400'}`}>
                        {getTeamName(bracket.semifinal2.teamA)}
                      </span>
                      <span className="text-xs text-gray-500">vs</span>
                      <span className={`font-semibold ${bracket.semifinal2.winner === bracket.semifinal2.teamB ? 'text-white' : 'text-gray-400'}`}>
                        {getTeamName(bracket.semifinal2.teamB)}
                      </span>
                    </div>
                    {bracket.semifinal2.status === 'finished' && (
                      <p className="mt-1 text-xs text-[#e94560]">
                        Ganador: {getTeamName(bracket.semifinal2.winner)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Final */}
          {isTournament && phase === 'final' && bracket.final && (
            <div className="rounded-2xl border border-[#e94560]/30 bg-[#e94560]/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                🏆 Final
              </p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{getTeamName(bracket.final.teamA)}</span>
                <span className="text-sm text-gray-500">vs</span>
                <span className="font-bold text-[#e94560]">{getTeamName(bracket.final.teamB)}</span>
              </div>
            </div>
          )}

          {isTournament && phase === 'group' && !match && groupMatches.filter((m) => m.status === 'finished').length === 0 && (
            <Button onClick={handleShuffleFixture} disabled={processing} variant="secondary">
              {processing ? 'Sorteando...' : '🎲 Sortear fixture'}
            </Button>
          )}

          {teams.length >= 2 && phase !== 'completed' && (
            <Button onClick={startMatch} disabled={processing}>
              {processing ? 'Iniciando...' : '▶️ Iniciar partido'}
            </Button>
          )}
        </div>
      ) : match.status === 'finished' ? (
        /* PARTIDO TERMINADO */
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-[#e94560]/30 bg-[#e94560]/10 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#e94560]">
              {phase === 'completed' ? '🏆 Final del torneo' : '🏆 Partido terminado'}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-white">{getTeamName(match.teamA)}</p>
                <p className="text-5xl font-black text-white">{scoreA}</p>
              </div>
              <div className="px-4 text-sm text-gray-500">vs</div>
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-[#e94560]">{getTeamName(match.teamB)}</p>
                <p className="text-5xl font-black text-[#e94560]">{scoreB}</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-white/10 p-4">
              <p className="text-sm text-gray-400">
                {phase === 'completed' ? 'Resultado final' : 'Ganador'}
              </p>
              <p className="text-2xl font-black text-[#e94560]">
                {getTeamName(match.winner)}
              </p>
            </div>
          </div>

          {phase !== 'completed' && (
            <Button onClick={handleNextMatch} disabled={processing}>
              {processing ? 'Cargando...' : '➡️ Siguiente partido'}
            </Button>
          )}

          {/* Standings after finished match */}
          {isTournament && phase === 'group' && standings.length > 0 && (
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
                {standings.map((s, i) => (
                  <div key={s.teamId} className={`grid grid-cols-5 gap-2 rounded-lg p-2 ${i < 2 ? 'bg-[#e94560]/10 border border-[#e94560]/20' : 'bg-white/5'}`}>
                    <span className="font-semibold text-white truncate">{s.teamName}</span>
                    <span className="text-center text-gray-400">{s.played}</span>
                    <span className="text-center text-[#e94560]">{s.wins}</span>
                    <span className="text-center text-gray-400">{s.pointsFor}</span>
                    <span className="text-center text-gray-400">
                      {s.diff > 0 ? `+${s.diff}` : s.diff}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* PARTIDO EN CURSO */
        <div className="flex flex-col gap-4">
          {isTournament && (
            <div className="text-center">
              <p className="text-xs font-bold text-[#e94560]">{phaseLabel[phase]}</p>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-white">{getTeamName(match.teamA)}</p>
                <p className="text-5xl font-black text-white">{scoreA}</p>
                <button
                  onClick={() => addPoint('A')}
                  disabled={processing}
                  className="mt-2 rounded-xl bg-[#e94560] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +1
                </button>
              </div>

              <div className="px-4 text-center">
                <p className="text-sm text-gray-500">vs</p>
              </div>

              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-[#e94560]">{getTeamName(match.teamB)}</p>
                <p className="text-5xl font-black text-[#e94560]">{scoreB}</p>
                <button
                  onClick={() => addPoint('B')}
                  disabled={processing}
                  className="mt-2 rounded-xl bg-[#0f3460] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +1
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500">
            Puntos para ganar: {sessionData?.pointsToWin || 15}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Queue view (queue mode only) */}
      {sessionData?.mode === 'queue' && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-3 font-semibold text-gray-300">Cola de espera</h3>
          {sessionData.queue?.length > 0 ? (
            <ol className="flex flex-col gap-2">
              {sessionData.queue.map((teamId, i) => (
                <li key={teamId} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="w-6 text-center text-xs text-gray-600">{i + 1}</span>
                  {getTeamName(teamId)}
                  {i === 0 && match?.status === 'playing' && (
                    <span className="text-xs text-[#e94560]">● Jugando</span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-500">Cola vacía</p>
          )}
        </div>
      )}
    </div>
  )
}
