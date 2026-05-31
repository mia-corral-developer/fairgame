const { initializeApp } = require('firebase/app')
const { getDatabase, ref, set, push } = require('firebase/database')

// Real Firebase config
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

function generateSessionCode(length = 6) {
  const chars = 'ACDEFGHJKLMNPQRTUVWXYZ2346789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function generateTeamPin() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

async function main() {
  // Create tournament session
  const sessionId = push(ref(db, 'sessions')).key
  const code = generateSessionCode()
  const refereeCode = generateTeamPin()

  const sessionData = {
    id: sessionId,
    name: 'Test Torneo',
    mode: 'round-robin',
    code,
    refereeCode,
    status: 'waiting',
    createdAt: Date.now(),
    teamCount: 4,
    currentMatch: null,
    queue: [],
    phase: 'group',
    pointsToWin: 30,
    groupMatches: {},
    bracket: {},
    standings: {},
    matches: {},
  }

  await set(ref(db, `sessions/${sessionId}`), sessionData)

  // Create 4 teams
  const teams = [
    { name: '🇨🇴 Colombia', city: 'Bogotá', captain: 'Juan Pérez', pin: generateTeamPin(), players: [{ name: 'Juan Pérez', number: '3101111111', captain: true }, { name: 'Carlos Ruiz', number: '3202222222' }] },
    { name: '🇦🇷 Argentina', city: 'Buenos Aires', captain: 'Diego Maradona', pin: generateTeamPin(), players: [{ name: 'Diego Maradona', number: '3303333333', captain: true }, { name: 'Leo Messi', number: '3404444444' }] },
    { name: '🇧🇷 Brasil', city: 'Río', captain: 'Pelé', pin: generateTeamPin(), players: [{ name: 'Pelé', number: '3505555555', captain: true }, { name: 'Neymar', number: '3606666666' }] },
    { name: '🇪🇸 España', city: 'Madrid', captain: 'Iniesta', pin: generateTeamPin(), players: [{ name: 'Iniesta', number: '3707777777', captain: true }, { name: 'Xavi', number: '3808888888' }] },
  ]

  const teamIds = []
  for (const t of teams) {
    const tid = push(ref(db, `teams/${sessionId}`)).key
    teamIds.push(tid)
    await set(ref(db, `teams/${sessionId}/${tid}`), {
      id: tid,
      sessionId,
      name: t.name,
      city: t.city,
      captain: t.captain,
      pin: t.pin,
      players: t.players,
      createdAt: Date.now(),
    })
  }

  // Update session with team IDs
  await set(ref(db, `sessions/${sessionId}/queue`), teamIds)

  console.log('✅ Tournament session created')
  console.log('Code:', code)
  console.log('Referee PIN:', refereeCode)
  console.log('Team IDs:', teamIds)
  console.log('')
  console.log('URL: https://fairgame-rouge.vercel.app/referee')

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
