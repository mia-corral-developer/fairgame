const { initializeApp } = require('firebase/app')
const { getDatabase, ref, get, remove } = require('firebase/database')

const firebaseConfig = {
  apiKey: "AIzaSy...cbSc",
  authDomain: "fairgame-65fdd.firebaseapp.com",
  databaseURL: "https://fairgame-65fdd-default-rtdb.firebaseio.com",
  projectId: "fairgame-65fdd",
  storageBucket: "fairgame-65fdd.firebasestorage.app",
  messagingSenderId: "967891397227",
  appId: "1:967891397227:web:1f8d0c8c3c7f4b8e9a6d5e"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

async function cleanupSessions() {
  const sessionsSnap = await get(ref(db, 'sessions'))
  if (!sessionsSnap.exists()) {
    console.log('No sessions found')
    process.exit(0)
  }

  const sessions = sessionsSnap.val()
  let deleted = 0
  let kept = 0

  for (const [sessionId, sessionData] of Object.entries(sessions)) {
    const name = sessionData?.name || ''
    if (name === 'Torneo 31 de Mayo') {
      console.log(`✅ KEEP: ${name} (${sessionId})`)
      kept++
    } else {
      console.log(`🗑️  DELETE: ${name || '(sin nombre)'} (${sessionId})`)
      await remove(ref(db, `sessions/${sessionId}`))
      deleted++
    }
  }

  console.log(`\n✅ Done! Kept: ${kept}, Deleted: ${deleted}`)
  process.exit(0)
}

cleanupSessions().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
