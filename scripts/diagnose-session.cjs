const { initializeApp } = require('firebase/app')
const { getDatabase, ref, get } = require('firebase/database')

const firebaseConfig = {
  apiKey: "AIzaSyBxoseznZOE4PufghU5HbvG4rhCwN8cbSc",
  authDomain: "fairgame-65fdd.firebaseapp.com",
  databaseURL: "https://fairgame-65fdd-default-rtdb.firebaseio.com",
  projectId: "fairgame-65fdd",
  storageBucket: "fairgame-65fdd.firebasestorage.app",
  messagingSenderId: "12828670518",
  appId: "1:12828670518:web:3bc3c50ab21991f845f697",
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

async function diagnose(code) {
  console.log(`🔍 Diagnosticando sesión: ${code}`)

  const codeSnap = await get(ref(db, `sessionCodes/${code.toUpperCase()}`))
  if (!codeSnap.exists()) {
    console.log('❌ Sesión no encontrada')
    process.exit(1)
  }

  const sessionId = codeSnap.val()
  const sessionSnap = await get(ref(db, `sessions/${sessionId}`))
  const session = sessionSnap.val()

  console.log(`
📋 Sesión: ${session.name}`)
  console.log(`   teamCount: ${session.teamCount || 0}`)
  console.log(`   queue length: ${session.queue?.length || 0}`)
  console.log(`   queue: ${JSON.stringify(session.queue || [])}`)

  const teamsSnap = await get(ref(db, `sessions/${sessionId}/teams`))
  if (teamsSnap.exists()) {
    const teams = teamsSnap.val()
    console.log(`
👥 Equipos en Firebase (${Object.keys(teams).length}):`)
    for (const [tid, t] of Object.entries(teams)) {
      console.log(`   - ${t.name} (${tid})`)
    }
  } else {
    console.log(`
👥 No hay equipos en Firebase`)
  }

  process.exit(0)
}

diagnose('4CREXW').catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
