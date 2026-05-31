const { initializeApp } = require('firebase/app')
const { getDatabase, ref, get } = require('firebase/database')

const firebaseConfig = {
  apiKey: "AIzaSy...Q8fR",
  authDomain: "fairgame-65fdd.firebaseapp.com",
  databaseURL: "https://fairgame-65fdd-default-rtdb.firebaseio.com",
  projectId: "fairgame-65fdd",
  storageBucket: "fairgame-65fdd.appspot.com",
  messagingSenderId: "967891397227",
  appId: "1:967891397227:web:1f8d0c8c3c7f4b8e9a6d5e"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

async function getSessionInfo() {
  const sessionsSnap = await get(ref(db, 'sessions'))
  if (!sessionsSnap.exists()) {
    console.log('No sessions found')
    process.exit(0)
  }

  const sessions = sessionsSnap.val()
  for (const [sessionId, sessionData] of Object.entries(sessions)) {
    console.log(`\n🏆 ${sessionData.name || 'Sin nombre'}`)
    console.log(`   Código: ${sessionData.code || 'N/A'}`)
    console.log(`   🔒 PIN Árbitro (refereeCode): ${sessionData.refereeCode || 'N/A'}`)
    console.log(`   Modo: ${sessionData.mode || 'N/A'}`)
    console.log(`\n   Equipos:`)
    
    const teams = sessionData.teams || {}
    for (const [teamId, team] of Object.entries(teams)) {
      console.log(`   - ${team.name || 'Sin nombre'}`)
      console.log(`     🔑 PIN Equipo: ${team.pin || 'N/A'}`)
      console.log(`     Jugadores: ${team.players?.length || 0}`)
      console.log(`     Capitán: ${team.captain || 'No definido'}`)
    }
  }
  process.exit(0)
}

getSessionInfo().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
