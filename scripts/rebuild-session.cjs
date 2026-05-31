const { initializeApp } = require('firebase/app')
const { getDatabase, ref, get, remove, set, push, update } = require('firebase/database')

const firebaseConfig = {
  apiKey: 'AIzaSyBxxx',
  authDomain: 'fairgame-65fdd.firebaseapp.com',
  databaseURL: 'https://fairgame-65fdd-default-rtdb.firebaseio.com',
  projectId: 'fairgame-65fdd',
  storageBucket: 'fairgame-65fdd.firebasestorage.app',
  messagingSenderId: '12828670518',
  appId: '1:12828670518:web:3bc3c50ab21991f845f697',
  measurementId: 'G-NQ8YJC9DDT'
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

// Session ID to rebuild
const OLD_SESSION_ID = '-OtlvQjexh27yF59AZn6'
const OLD_SESSION_CODE = 'DB76W6'

function generateSessionCode() {
  const chars = 'ACDEFGHJKLMNPQRTUVWXYZ2346789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function generateTeamPin() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

// Shuffle array (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateGroupMatches(teamIds) {
  const matches = {}
  const pairs = []
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairs.push([teamIds[i], teamIds[j]])
    }
  }
  // Shuffle for random fixture order
  const shuffledPairs = shuffle(pairs)
  shuffledPairs.forEach((pair, index) => {
    const mid = `gm-${String(index + 1).padStart(2, '0')}`
    matches[mid] = {
      id: mid,
      status: 'scheduled',
      teamA: pair[0],
      teamB: pair[1],
      scoreA: 0,
      scoreB: 0,
      order: index,
    }
  })
  return matches
}

async function rebuildSession() {
  console.log('=== RECONSTRUYENDO SESIÓN ===\n')
  console.log('1. Extrayendo datos de la sesión vieja...')

  // Get old session data
  const oldSessionSnap = await get(ref(db, `sessions/${OLD_SESSION_ID}`))
  if (!oldSessionSnap.exists()) {
    console.log('⛔ Sesión vieja no encontrada!')
    process.exit(1)
  }

  const oldSession = oldSessionSnap.val()

  // Get old team data
  const oldTeamsSnap = await get(ref(db, `sessions/${OLD_SESSION_ID}/teams`))
  if (!oldTeamsSnap.exists()) {
    console.log('⛔ Equipos no encontrados en sesión vieja!')
    process.exit(1)
  }

  const oldTeams = oldTeamsSnap.val()
  console.log(`   ✓ Encontrados ${Object.keys(oldTeams).length} equipos`)

  // Extract team data with original PINs
  const teamDataList = Object.entries(oldTeams).map(([id, t]) => ({
    origId: id,
    name: t.name,
    city: t.city || '',
    captain: t.captain,
    pin: t.pin,
    players: t.players || [],
  }))

  console.log('   Equipos:', teamDataList.map((t) => `${t.name} (PIN: ${t.pin})`).join(', '))

  // Get old matches
  const oldMatchesSnap = await get(ref(db, `sessions/${OLD_SESSION_ID}/matches`))
  const oldMatches = oldMatchesSnap.exists() ? oldMatchesSnap.val() : {}

  // Save backup
  const backupId = push(ref(db, 'backups')).key
  const backupData = {
    createdAt: Date.now(),
    reason: 'Rebuilt for tournament engine',
    originalSession: oldSession,
    originalTeams: oldTeams,
    originalMatches: oldMatches,
  }
  await set(ref(db, `backups/${backupId}`), backupData)
  console.log(`   ✓ Backup guardado: backups/${backupId}`)

  // 2. Delete old session
  console.log('\n2. Eliminando sesión vieja...')
  await remove(ref(db, `sessionCodes/${OLD_SESSION_CODE}`))
  await remove(ref(db, `sessions/${OLD_SESSION_ID}`))
  console.log('   ✓ Sesión vieja eliminada')

  // 3. Create new session
  console.log('\n3. Creando nueva sesión "Todos contra todos"...')

  const newSessionId = push(ref(db, 'sessions')).key
  const newCode = OLD_SESSION_CODE // Keep same code
  const refereeCode = '2305' // Keep same referee PIN

  const newTeamIds = {}
  const teamIds = []

  // Recreate teams
  for (const t of teamDataList) {
    const newTeamId = push(ref(db, `teams`)).key
    teamIds.push(newTeamId)
    newTeamIds[t.origId] = newTeamId

    await set(ref(db, `teams/${newTeamId}`), {
      id: newTeamId,
      sessionId: newSessionId,
      name: t.name,
      city: t.city,
      captain: t.captain,
      pin: t.pin, // PRESERVE ORIGINAL PIN
      players: t.players,
      createdAt: Date.now(),
    })
  }

  console.log('   ✓ Equipos recreados con PINs originales')

  // Initialize standings
  const standings = {}
  teamIds.forEach((tid) => {
    standings[tid] = { wins: 0, played: 0, pointsFor: 0, pointsAgainst: 0 }
  })

  // Generate fixture
  const groupMatches = generateGroupMatches(teamIds)
  console.log(`   ✓ Fixture generado: ${Object.keys(groupMatches).length} partidos`)

  const sessionData = {
    id: newSessionId,
    name: 'Torneo 31 de Mayo',
    mode: 'round-robin',
    code: newCode,
    refereeCode: refereeCode,
    status: 'waiting',
    createdAt: Date.now(),
    teamCount: teamIds.length,
    currentMatch: null,
    queue: teamIds, // Queue with all team IDs
    phase: 'group',
    pointsToWin: 30,
    groupMatches,
    bracket: {},
    standings,
    matches: {},
    teams: [],
  }

  await set(ref(db, `sessions/${newSessionId}`), sessionData)
  await set(ref(db, `sessionCodes/${newCode}`), newSessionId)

  console.log('\n=== ✅ SESIÓN RECONSTRUIDA ===')
  console.log('Nuevo Session ID:', newSessionId)
  console.log('Código:', newCode)
  console.log('PIN Árbitro:', refereeCode)
  console.log('')
  console.log('Equipos:')
  teamDataList.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name} - PIN: ${t.pin}`)
  })
  console.log('')
  console.log('Fixture (6 partidos):')
  const sortedMatches = Object.values(groupMatches).sort((a, b) => a.order - b.order)
  sortedMatches.forEach((m, i) => {
    const teamA = teamDataList.find((t) => newTeamIds[t.origId] === m.teamA)
    const teamB = teamDataList.find((t) => newTeamIds[t.origId] === m.teamB)
    console.log(`  ${i + 1}. ${teamA?.name || '?'} vs ${teamB?.name || '?'}`)
  })
  console.log('')
  console.log('Links:')
  console.log(`  Espectador: https://fairgame-rouge.vercel.app/spectator/${newCode}`)
  console.log(`  Árbitro: https://fairgame-rouge.vercel.app/referee`)
}

rebuildSession()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
