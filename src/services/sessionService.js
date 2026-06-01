import { getFirebaseDB } from './firebase'
import {
  ref,
  set,
  get,
  update,
  push,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,
} from 'firebase/database'

function generateSessionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function generateTeamPin() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function getPointsToWin(teamCount, mode) {
  if (mode === 'round-robin') return 30
  if (teamCount <= 4) return 15
  if (teamCount <= 6) return 12
  return 10
}

function getMaxConsecutiveWins(teamCount) {
  return teamCount <= 4 ? 2 : 3
}

export async function createSession({ name, mode }) {
  const db = getFirebaseDB()
  const sessionRef = push(ref(db, 'sessions'))
  const sessionId = sessionRef.key
  const code = generateSessionCode()

  const isRoundRobin = mode === 'round-robin'

  const sessionData = {
    id: sessionId,
    name: name.trim(),
    mode,
    code,
    refereeCode: generateTeamPin(),
    status: 'waiting',
    createdAt: Date.now(),
    teamCount: 0,
    currentMatch: null,
    queue: [],
    // Tournament-specific fields (round-robin only)
    phase: isRoundRobin ? 'group' : undefined,
    pointsToWin: isRoundRobin ? 30 : undefined,
    groupMatches: isRoundRobin ? {} : undefined,
    bracket: isRoundRobin ? {} : undefined,
    standings: {},
  }

  // Clean undefined values before saving
  Object.keys(sessionData).forEach((key) => {
    if (sessionData[key] === undefined) delete sessionData[key]
  })

  await set(sessionRef, sessionData)
  await set(ref(db, `sessionCodes/${code}`), sessionId)

  return { sessionId, code, refereeCode: sessionData.refereeCode }
}

export async function getSessionByCode(code) {
  const db = getFirebaseDB()
  const snapshot = await get(ref(db, `sessionCodes/${code.toUpperCase()}`))
  if (!snapshot.exists()) return null

  const sessionId = snapshot.val()
  const sessionSnap = await get(ref(db, `sessions/${sessionId}`))
  if (!sessionSnap.exists()) return null

  return { sessionId, ...sessionSnap.val() }
}

export async function getSession(sessionId) {
  const db = getFirebaseDB()
  const snapshot = await get(ref(db, `sessions/${sessionId}`))
  return snapshot.exists() ? snapshot.val() : null
}

export function subscribeToSession(sessionId, callback) {
  const db = getFirebaseDB()
  const sessionRef = ref(db, `sessions/${sessionId}`)
  onValue(sessionRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null)
  })
  return () => off(sessionRef)
}

export async function updateSession(sessionId, updates) {
  const db = getFirebaseDB()
  await update(ref(db, `sessions/${sessionId}`), updates)
}

export async function addTeamToSession(sessionId, teamId) {
  const db = getFirebaseDB()
  const session = await getSession(sessionId)
  const newCount = (session?.teamCount || 0) + 1

  const updates = {
    teamCount: newCount,
  }

  // Only update dynamic points for queue mode
  if (session?.mode === 'queue') {
    updates.pointsToWin = getPointsToWin(newCount, 'queue')
    updates.maxConsecutiveWins = getMaxConsecutiveWins(newCount)
    updates.queue = [...(session.queue || []), teamId]
  }

  await update(ref(db, `sessions/${sessionId}`), updates)
}

export async function createTeam({ sessionId, name, players }) {
  const db = getFirebaseDB()

  // Check session mode and team count limits
  const session = await getSession(sessionId)
  if (session?.mode === 'round-robin') {
    const teamsSnap = await get(ref(db, 'teams'))
    const allTeams = teamsSnap.exists() ? teamsSnap.val() : {}
    const sessionTeamCount = Object.values(allTeams).filter((t) => t.sessionId === sessionId).length
    if (sessionTeamCount >= 4) {
      throw new Error('El modo Todos contra todos permite máximo 4 equipos. Ya están completos.')
    }
  }

  // Validate no duplicate players across teams
  const teamsSnap = await get(ref(db, 'teams'))
  if (teamsSnap.exists()) {
    const allTeams = teamsSnap.val()
    const existingPlayers = new Set()
    for (const tid in allTeams) {
      const team = allTeams[tid]
      if (team.sessionId !== sessionId) continue
      if (team.players && Array.isArray(team.players)) {
        team.players.forEach((p) => {
          if (typeof p === 'string') {
            existingPlayers.add(p.toLowerCase().trim())
          } else if (p.name) {
            existingPlayers.add(p.name.toLowerCase().trim())
          }
        })
      }
    }
    for (const player of players) {
      const playerName = typeof player === 'string' ? player : player.name
      const normalized = playerName.toLowerCase().trim()
      if (normalized && existingPlayers.has(normalized)) {
        throw new Error(`El jugador "${playerName}" ya está en otro equipo`)
      }
    }
  }

  const teamRef = push(ref(db, 'teams'))
  const teamId = teamRef.key
  const pin = generateTeamPin()

  const captain = players.find((p) => p.isCaptain)

  const teamData = {
    id: teamId,
    sessionId,
    name: name.trim(),
    players: players.filter((p) => p.name.trim()),
    captain: captain ? captain.name : players[0]?.name,
    pin,
    wins: 0,
    losses: 0,
    consecutiveWins: 0,
    totalPoints: 0,
    createdAt: Date.now(),
  }

  await set(teamRef, teamData)
  await addTeamToSession(sessionId, teamId)

  return { teamId, pin }
}

export async function getTeam(sessionId, teamId) {
  const db = getFirebaseDB()
  const snapshot = await get(ref(db, `teams/${teamId}`))
  return snapshot.exists() ? snapshot.val() : null
}

export async function validateTeamPin(sessionId, teamId, pin) {
  const team = await getTeam(sessionId, teamId)
  return team?.pin === pin
}

export function subscribeToTeams(sessionId, callback) {
  const db = getFirebaseDB()
  const teamsRef = ref(db, 'teams')
  onValue(teamsRef, (snapshot) => {
    const teams = []
    snapshot.forEach((child) => {
      const team = child.val()
      if (team.sessionId === sessionId) {
        teams.push({ id: child.key, ...team })
      }
    })
    callback(teams)
  })
  return () => off(teamsRef)
}

export async function updateTeam(sessionId, teamId, updates) {
  const db = getFirebaseDB()
  await update(ref(db, `teams/${teamId}`), updates)
}

export async function penalizeTeamEdit(sessionId, teamId) {
  const db = getFirebaseDB()
  const session = await getSession(sessionId)
  if (!session || session.mode !== 'queue') return

  let queue = [...(session.queue || [])]
  queue = queue.filter((id) => id !== teamId)
  queue.push(teamId)

  await update(ref(db, `sessions/${sessionId}`), { queue })
  return queue
}

// ─────── TOURNAMENT (round-robin) FUNCTIONS ───────

/**
 * Generate all group matches (round-robin) for given team IDs.
 * Returns an object keyed by matchId.
 */
// Circle method: guarantees each team plays exactly once per round.
// Returns [{ pairs: [{teamA, teamB}], bye: teamId|null }]
function buildRoundRobinRounds(teamIds) {
  const teams = [...teamIds]
  const isOdd = teams.length % 2 === 1
  if (isOdd) teams.push(null) // bye slot for odd counts
  const n = teams.length
  const fixed = teams[0]
  const rotating = teams.slice(1)
  const roundData = []

  for (let r = 0; r < n - 1; r++) {
    const current = [fixed, ...rotating]
    const pairs = []
    let bye = null
    for (let i = 0; i < n / 2; i++) {
      const a = current[i]
      const b = current[n - 1 - i]
      if (a === null) bye = b
      else if (b === null) bye = a
      else pairs.push({ teamA: a, teamB: b })
    }
    roundData.push({ pairs, bye })
    rotating.unshift(rotating.pop())
  }
  return roundData
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

function generateGroupMatches(teamIds) {
  const roundData = buildRoundRobinRounds(teamIds)
  shuffle(roundData)

  const matches = {}
  const groupByes = {}
  let idx = 1

  roundData.forEach(({ pairs, bye }, roundIdx) => {
    const roundNum = roundIdx + 1
    if (bye) groupByes[roundNum] = bye
    shuffle(pairs)
    pairs.forEach((m) => {
      if (Math.random() < 0.5) [m.teamA, m.teamB] = [m.teamB, m.teamA]
      const matchId = `gm-${String(idx).padStart(2, '0')}`
      matches[matchId] = {
        id: matchId,
        round: roundNum,
        teamA: m.teamA,
        teamB: m.teamB,
        status: 'scheduled',
        scoreA: 0,
        scoreB: 0,
        winner: null,
        startedAt: null,
        finishedAt: null,
      }
      idx++
    })
  })

  return { matches, groupByes }
}

/**
 * Initialize group matches when the referee starts the first match.
 * Only runs once for round-robin sessions.
 */
export async function initGroupMatches(sessionId) {
  const db = getFirebaseDB()
  const session = await getSession(sessionId)
  if (!session || session.mode !== 'round-robin') return false
  if (session.groupMatches && Object.keys(session.groupMatches).length > 0) return false

  const teamsSnap = await get(ref(db, 'teams'))
  const allTeams = teamsSnap.exists() ? teamsSnap.val() : {}
  const teamIds = Object.entries(allTeams)
    .filter(([, t]) => t.sessionId === sessionId)
    .map(([id]) => id)

  if (teamIds.length < 2) return false

  const { matches: groupMatches, groupByes } = generateGroupMatches(teamIds)
  await update(ref(db, `sessions/${sessionId}`), { groupMatches, groupByes })
  return true
}

/**
 * Get the next unplayed scheduled match for the tournament.
 * Returns { matchId, teamA, teamB } or null.
 */
export async function getNextTournamentMatch(sessionId) {
  const db = getFirebaseDB()
  const session = await getSession(sessionId)
  if (!session || session.mode !== 'round-robin') return null

  const phase = session.phase || 'group'

  // Group phase: pick next scheduled group match in fixture order
  if (phase === 'group') {
    const groupMatches = session.groupMatches || {}
    const sorted = Object.entries(groupMatches).sort(([a], [b]) => a.localeCompare(b))
    for (const [matchId, match] of sorted) {
      if (match.status === 'scheduled') {
        return { matchId, teamA: match.teamA, teamB: match.teamB }
      }
    }
    return null
  }

  // Knockout phase: check bracket
  const bracket = session.bracket || {}

  if (phase === 'semifinals') {
    if (bracket.semifinal1?.status === 'scheduled') {
      return { matchId: 'semifinal1', teamA: bracket.semifinal1.teamA, teamB: bracket.semifinal1.teamB }
    }
    if (bracket.semifinal2?.status === 'scheduled') {
      return { matchId: 'semifinal2', teamA: bracket.semifinal2.teamA, teamB: bracket.semifinal2.teamB }
    }
    return null
  }

  if (phase === 'final') {
    if (bracket.final?.status === 'scheduled') {
      return { matchId: 'final', teamA: bracket.final.teamA, teamB: bracket.final.teamB }
    }
    return null
  }

  return null
}

/**
 * Create a match record for the current tournament match.
 * Also updates the groupMatches/bracket entry to 'playing'.
 */
export async function createTournamentMatch({ sessionId, matchId, teamA, teamB }) {
  const db = getFirebaseDB()
  const session = await getSession(sessionId)
  const phase = session?.phase || 'group'

  const matchData = {
    id: matchId,
    teamA,
    teamB,
    scoreA: 0,
    scoreB: 0,
    winner: null,
    status: 'playing',
    startedAt: Date.now(),
    finishedAt: null,
  }

  if (phase === 'group') {
    await update(ref(db, `sessions/${sessionId}/groupMatches/${matchId}`), {
      status: 'playing',
      startedAt: Date.now(),
    })
  } else {
    // For knockout, store the full match in bracket
    await update(ref(db, `sessions/${sessionId}/bracket/${matchId}`), {
      ...matchData,
    })
  }

  await update(ref(db, `sessions/${sessionId}`), {
    currentMatch: { teamA, teamB, matchId },
  })

  return matchId
}

/**
 * Finish a group match, update standings, check if group phase is done.
 */
export async function finishGroupMatch(sessionId, matchId, winnerTeamId, scoreA, scoreB) {
  const db = getFirebaseDB()

  // 1. Mark match as finished
  await update(ref(db, `sessions/${sessionId}/groupMatches/${matchId}`), {
    winner: winnerTeamId,
    status: 'finished',
    scoreA,
    scoreB,
    finishedAt: Date.now(),
  })

  // 2. Update currentMatch
  await update(ref(db, `sessions/${sessionId}/currentMatch`), {
    status: 'finished',
    winner: winnerTeamId,
  })

  // 3. Update standings
  const session = await getSession(sessionId)
  const match = session.groupMatches?.[matchId]
  if (!match) return

  const loserTeamId = winnerTeamId === match.teamA ? match.teamB : match.teamA

  const standings = { ...(session.standings || {}) }

  // Winner
  if (!standings[winnerTeamId]) {
    standings[winnerTeamId] = { wins: 0, played: 0, pointsFor: 0, pointsAgainst: 0 }
  }
  standings[winnerTeamId].wins += 1
  standings[winnerTeamId].played += 1
  standings[winnerTeamId].pointsFor += scoreA > scoreB ? scoreA : scoreB
  standings[winnerTeamId].pointsAgainst += scoreA > scoreB ? scoreB : scoreA

  // Loser
  if (!standings[loserTeamId]) {
    standings[loserTeamId] = { wins: 0, played: 0, pointsFor: 0, pointsAgainst: 0 }
  }
  standings[loserTeamId].played += 1
  standings[loserTeamId].pointsFor += scoreA > scoreB ? scoreB : scoreA
  standings[loserTeamId].pointsAgainst += scoreA > scoreB ? scoreA : scoreB

  await update(ref(db, `sessions/${sessionId}`), { standings })

  // 4. Check if all group matches are finished
  const allFinished = Object.values(session.groupMatches || {}).every(
    (m) => m.status === 'finished'
  )
  if (allFinished) {
    await transitionToSemifinals(sessionId)
  }
}

/**
 * Get standings ordered by: wins desc, diff desc, pointsFor desc.
 * Returns array of { teamId, wins, played, pointsFor, pointsAgainst, diff }.
 */
export async function getOrderedStandings(sessionId) {
  const db = getFirebaseDB()
  const session = await getSession(sessionId)
  const standings = session?.standings || {}

  // Read teams from root collection, filter by sessionId client-side
  const teamsSnap = await get(ref(db, 'teams'))
  const allTeams = teamsSnap.exists() ? teamsSnap.val() : {}
  const teamIds = Object.entries(allTeams)
    .filter(([, t]) => t.sessionId === sessionId)
    .map(([id]) => id)

  const result = teamIds.map((teamId) => {
    const s = standings[teamId] || { wins: 0, played: 0, pointsFor: 0, pointsAgainst: 0 }
    return {
      teamId,
      teamName: allTeams[teamId]?.name || 'Equipo',
      wins: s.wins,
      played: s.played,
      pointsFor: s.pointsFor,
      pointsAgainst: s.pointsAgainst,
      diff: s.pointsFor - s.pointsAgainst,
    }
  })

  result.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.diff !== a.diff) return b.diff - a.diff
    return b.pointsFor - a.pointsFor
  })

  return result
}

/**
 * Transition from group phase to semifinals.
 */
export async function transitionToSemifinals(sessionId) {
  const db = getFirebaseDB()
  const standings = await getOrderedStandings(sessionId)

  if (standings.length < 4) {
    // Not enough teams for semifinals, just mark as completed
    await update(ref(db, `sessions/${sessionId}`), { phase: 'completed' })
    return
  }

  const bracket = {
    semifinal1: {
      label: 'Semifinal 1',
      teamA: standings[0].teamId,
      teamB: standings[3].teamId,
      status: 'scheduled',
      scoreA: 0,
      scoreB: 0,
      winner: null,
    },
    semifinal2: {
      label: 'Semifinal 2',
      teamA: standings[1].teamId,
      teamB: standings[2].teamId,
      status: 'scheduled',
      scoreA: 0,
      scoreB: 0,
      winner: null,
    },
    final: {
      label: 'Final',
      teamA: null,
      teamB: null,
      status: 'waiting',
      scoreA: 0,
      scoreB: 0,
      winner: null,
    },
  }

  await update(ref(db, `sessions/${sessionId}`), {
    phase: 'semifinals',
    bracket,
  })
}

/**
 * Finish a knockout match (semifinal or final).
 */
export async function finishKnockoutMatch(sessionId, bracketKey, winnerTeamId, scoreA, scoreB) {
  const db = getFirebaseDB()

  await update(ref(db, `sessions/${sessionId}/bracket/${bracketKey}`), {
    winner: winnerTeamId,
    status: 'finished',
    scoreA,
    scoreB,
    finishedAt: Date.now(),
  })

  await update(ref(db, `sessions/${sessionId}/currentMatch`), {
    status: 'finished',
    winner: winnerTeamId,
  })

  // Check if both semifinals are done → advance to final
  if (bracketKey.startsWith('semifinal')) {
    const session = await getSession(sessionId)
    const bracket = session?.bracket || {}
    if (bracket.semifinal1?.status === 'finished' && bracket.semifinal2?.status === 'finished') {
      await transitionToFinal(sessionId)
    }
  }

  // If final is done → mark tournament completed
  if (bracketKey === 'final') {
    await update(ref(db, `sessions/${sessionId}`), {
      phase: 'completed',
      champion: winnerTeamId,
      status: 'finished',
    })
  }
}

/**
 * Transition from semifinals to final.
 */
export async function transitionToFinal(sessionId) {
  const db = getFirebaseDB()
  const session = await getSession(sessionId)
  const bracket = session?.bracket || {}

  const final = {
    label: 'Final',
    teamA: bracket.semifinal1?.winner || null,
    teamB: bracket.semifinal2?.winner || null,
    status: 'scheduled',
    scoreA: 0,
    scoreB: 0,
    winner: null,
  }

  await update(ref(db, `sessions/${sessionId}`), {
    phase: 'final',
    'bracket/final': final,
  })
}

/**
 * Shuffle the group stage fixture order randomly.
 * Only allowed before any match has been played.
 */
export async function shuffleGroupMatches(sessionId) {
  const db = getFirebaseDB()
  const session = await getSession(sessionId)
  if (!session) throw new Error('Sesión no encontrada')
  if (session.phase !== 'group') throw new Error('Solo se puede sortear en fase de grupos')
  if (session.currentMatch) throw new Error('Termina el partido actual primero')

  // Generate matches first if they haven't been created yet
  let groupMatchesObj = session.groupMatches || {}
  if (Object.keys(groupMatchesObj).length === 0) {
    await initGroupMatches(sessionId)
    const fresh = await getSession(sessionId)
    groupMatchesObj = fresh.groupMatches || {}
  }

  const entries = Object.entries(groupMatchesObj).sort(([a], [b]) => a.localeCompare(b))
  const played = entries.filter(([, m]) => m.status === 'finished').length
  if (played > 0) throw new Error('No se puede sortear después de iniciar el torneo')

  // Regenerate schedule using circle method so no team plays back-to-back
  const teamIds = [...new Set(entries.flatMap(([, m]) => [m.teamA, m.teamB]))]
  const roundData = buildRoundRobinRounds(teamIds)
  shuffle(roundData)
  roundData.forEach(({ pairs }) => {
    shuffle(pairs)
    pairs.forEach((m) => { if (Math.random() < 0.5) [m.teamA, m.teamB] = [m.teamB, m.teamA] })
  })

  const newPairs = roundData.flatMap(({ pairs }) => pairs)
  const pairsPerRound = roundData[0]?.pairs.length || Math.floor(teamIds.length / 2)

  const groupByes = {}
  roundData.forEach(({ bye }, i) => { if (bye) groupByes[i + 1] = bye })

  const updates = { [`sessions/${sessionId}/groupByes`]: Object.keys(groupByes).length > 0 ? groupByes : null }
  entries.forEach(([matchId], i) => {
    updates[`sessions/${sessionId}/groupMatches/${matchId}/teamA`] = newPairs[i].teamA
    updates[`sessions/${sessionId}/groupMatches/${matchId}/teamB`] = newPairs[i].teamB
    updates[`sessions/${sessionId}/groupMatches/${matchId}/round`] = Math.floor(i / pairsPerRound) + 1
  })

  await update(ref(db), updates)
}

// ─────── LEGACY FUNCTIONS (kept for queue mode compatibility) ───────

export async function createMatch({ sessionId, teamA, teamB }) {
  const db = getFirebaseDB()
  const matchRef = push(ref(db, `sessions/${sessionId}/matches`))
  const matchId = matchRef.key

  const matchData = {
    id: matchId,
    teamA,
    teamB,
    scoreA: 0,
    scoreB: 0,
    winner: null,
    status: 'playing',
    startedAt: Date.now(),
    finishedAt: null,
  }

  await set(matchRef, matchData)
  await update(ref(db, `sessions/${sessionId}`), {
    currentMatch: { teamA, teamB, matchId },
  })

  return matchId
}

export async function updateMatchScore(sessionId, matchId, { scoreA, scoreB }, logEntry = null) {
  const db = getFirebaseDB()
  const session = await getSession(sessionId)

  let matchPath
  if (session?.groupMatches?.[matchId] !== undefined) {
    matchPath = `sessions/${sessionId}/groupMatches/${matchId}`
  } else if (session?.bracket?.[matchId] !== undefined) {
    matchPath = `sessions/${sessionId}/bracket/${matchId}`
  } else {
    matchPath = `sessions/${sessionId}/matches/${matchId}`
  }

  const updates = {
    [`${matchPath}/scoreA`]: scoreA,
    [`${matchPath}/scoreB`]: scoreB,
  }

  if (logEntry) {
    const logKey = push(ref(db, `${matchPath}/pointLog`)).key
    updates[`${matchPath}/pointLog/${logKey}`] = logEntry
  }

  await update(ref(db), updates)
}

export async function finishMatch(sessionId, matchId, winnerTeamId) {
  const db = getFirebaseDB()
  const matchSnap = await get(ref(db, `sessions/${sessionId}/matches/${matchId}`))
  if (!matchSnap.exists()) return

  const match = matchSnap.val()
  const updates = {
    winner: winnerTeamId,
    status: 'finished',
    finishedAt: Date.now(),
  }

  await update(ref(db, `sessions/${sessionId}/matches/${matchId}`), updates)

  await update(ref(db, `sessions/${sessionId}/currentMatch`), {
    status: 'finished',
    winner: winnerTeamId,
  })

  const winnerRef = ref(db, `teams/${winnerTeamId}`)
  const loserTeamId = winnerTeamId === match.teamA ? match.teamB : match.teamA
  const loserRef = ref(db, `teams/${loserTeamId}`)

  const [winnerSnap, loserSnap] = await Promise.all([get(winnerRef), get(loserRef)])
  const winner = winnerSnap.val()
  const loser = loserSnap.val()

  await update(winnerRef, {
    wins: (winner.wins || 0) + 1,
    consecutiveWins: (winner.consecutiveWins || 0) + 1,
    totalPoints: (winner.totalPoints || 0) + (match.scoreA > match.scoreB ? match.scoreA : match.scoreB),
  })

  await update(loserRef, {
    losses: (loser.losses || 0) + 1,
    consecutiveWins: 0,
  })

  return { winner, loser }
}

export function subscribeToCurrentMatch(sessionId, callback) {
  const db = getFirebaseDB()
  const matchRef = ref(db, `sessions/${sessionId}/currentMatch`)
  onValue(matchRef, async (snapshot) => {
    const current = snapshot.val()
    if (!current) {
      callback(null)
      return
    }

    // For tournament mode, read from groupMatches or bracket
    const sessionSnap = await get(ref(db, `sessions/${sessionId}`))
    const session = sessionSnap.exists() ? sessionSnap.val() : null
    const phase = session?.phase
    const mode = session?.mode

    let match = null
    if (mode === 'round-robin' && phase) {
      // Try groupMatches first
      if (phase === 'group' || session?.groupMatches?.[current.matchId]) {
        match = session?.groupMatches?.[current.matchId] || null
      }
      // Then bracket
      if (!match && session?.bracket?.[current.matchId]) {
        match = session.bracket[current.matchId]
      }
    }

    // Fallback to legacy matches collection
    if (!match) {
      const matchSnap = await get(ref(db, `sessions/${sessionId}/matches/${current.matchId}`))
      match = matchSnap.exists() ? matchSnap.val() : null
    }

    callback(match)
  })
  return () => off(matchRef)
}

export async function rotateQueue(sessionId, winnerTeamId, loserTeamId) {
  const db = getFirebaseDB()
  const session = await getSession(sessionId)
  if (!session || session.mode !== 'queue') return

  let queue = [...(session.queue || [])]
  queue = queue.filter((id) => id !== winnerTeamId && id !== loserTeamId)
  queue.push(loserTeamId)

  const winnerSnap = await get(ref(db, `teams/${winnerTeamId}`))
  const winner = winnerSnap.val()
  const maxConsecutive = session.maxConsecutiveWins || getMaxConsecutiveWins(session.teamCount || 4)
  const reachedLimit = (winner?.consecutiveWins || 0) >= maxConsecutive

  if (reachedLimit) {
    const middleIndex = Math.floor(queue.length / 2)
    queue.splice(middleIndex, 0, winnerTeamId)
  } else {
    queue.unshift(winnerTeamId)
  }

  await update(ref(db, `sessions/${sessionId}`), { queue })
  return queue
}

export async function getNextMatchTeams(sessionId) {
  const db = getFirebaseDB()
  const session = await getSession(sessionId)
  if (!session || !session.queue || session.queue.length < 2) return null

  const queue = session.queue
  return {
    teamA: queue[0],
    teamB: queue[1],
  }
}

export async function clearCurrentMatch(sessionId) {
  const db = getFirebaseDB()
  await update(ref(db, `sessions/${sessionId}`), {
    currentMatch: null,
  })
}

export async function getActiveSessions() {
  const db = getFirebaseDB()
  const sessionsSnap = await get(ref(db, 'sessions'))
  if (!sessionsSnap.exists()) return []

  const sessions = sessionsSnap.val()
  return Object.values(sessions)
    .filter((s) => s.status !== 'finished')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20)
}
