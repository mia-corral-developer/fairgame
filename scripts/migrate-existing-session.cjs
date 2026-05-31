const { initializeApp } = require('firebase/app')
const { getDatabase, ref, get, update } = require('firebase/database')

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

async function migrateSession(sessionCode) {
  // Find session by code
  const sessionsRef = ref(db, 'sessions')
  const sessionsSnap = await get(sessionsRef)
  
  if (!sessionsSnap.exists()) {
    console.log('⛔ No sessions found')
    return
  }

  let sessionId = null
  let sessionData = null

  sessionsSnap.forEach((child) => {
    const s = child.val()
    if (s.code === sessionCode) {
      sessionId = child.key
      sessionData = s
    }
  })

  if (!sessionId) {
    console.log('⛔ Session not found:', sessionCode)
    return
  }

  console.log('✅ Found session:', sessionData.name, '| ID:', sessionId)
  console.log('Current mode:', sessionData.mode)
  console.log('Current teamCount:', sessionData.teamCount || sessionData.teamIds?.length || 0)

  // Verify it's round-robin
  if (sessionData.mode !== 'round-robin') {
    console.log('⚠️ Session mode is not round-robin, aborting.')
    return
  }

  // Build migration update — ONLY add missing fields, never overwrite
  const migration = {}
  let needsMigration = false

  if (!sessionData.phase) {
    migration['phase'] = 'group'
    needsMigration = true
    console.log('  + adding phase: group')
  } else {
    console.log('  · phase already exists:', sessionData.phase)
  }

  if (sessionData.pointsToWin === undefined) {
    migration['pointsToWin'] = 30
    needsMigration = true
    console.log('  + adding pointsToWin: 30')
  } else {
    console.log('  · pointsToWin already exists:', sessionData.pointsToWin)
  }

  if (!sessionData.groupMatches) {
    migration['groupMatches'] = {}
    needsMigration = true
    console.log('  + adding groupMatches: {}')
  } else {
    console.log('  · groupMatches already exists')
  }

  if (!sessionData.bracket) {
    migration['bracket'] = {}
    needsMigration = true
    console.log('  + adding bracket: {}')
  } else {
    console.log('  · bracket already exists')
  }

  if (!sessionData.standings || Object.keys(sessionData.standings || {}).length === 0) {
    // Initialize standings for each team in queue
    const teamIds = sessionData.queue || []
    const standings = {}
    teamIds.forEach((tid) => {
      standings[tid] = { wins: 0, played: 0, pointsFor: 0, pointsAgainst: 0 }
    })
    migration['standings'] = standings
    needsMigration = true
    console.log('  + adding standings for', teamIds.length, 'teams')
  } else {
    console.log('  · standings already exists')
  }

  if (!needsMigration) {
    console.log('✅ Session already migrated. No changes needed.')
    return
  }

  // Apply migration using update (never overwrites, only adds missing)
  await update(ref(db, `sessions/${sessionId}`), migration)
  console.log('✅ Migration complete! Session', sessionCode, 'updated.')
}

async function main() {
  // Migrate Torneo 31 de Mayo
  await migrateSession('DB76W6')

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
