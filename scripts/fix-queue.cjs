const { initializeApp } = require('firebase/app')
const { getDatabase, ref, get, update } = require('firebase/database')

const firebaseConfig = {
  apiKey: "AIzaSy...cbSc",
  authDomain: "fairgame-65fdd.firebaseapp.com",
  databaseURL: "https://fairgame-65fdd-default-rtdb.firebaseio.com",
  projectId: "fairgame-65fdd",
  storageBucket: "fairgame-65fdd.firebasestorage.app",
  messagingSenderId: "12828670518",
  appId: "1:12828670518:web:3bc3c50ab21991f845f697",
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

async function fixQueue(code) {
  console.log(`\ud83d\udd27 Fixeando cola de sesión: ${code}`)

  const codeSnap = await get(ref(db, `sessionCodes/${code.toUpperCase()}`))
  const sessionId = codeSnap.val()

  const teamsSnap = await get(ref(db, `sessions/${sessionId}/teams`))
  const teams = teamsSnap.val()
  const teamIds = Object.keys(teams)

  console.log(`   Equipos encontrados: ${teamIds.length}`)

  const queue = teamIds
  await update(ref(db, `sessions/${sessionId}`), { queue })

  console.log(`\u2705 Cola actualizada: ${JSON.stringify(queue)}`)
  process.exit(0)
}

fixQueue('4CREXW').catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
