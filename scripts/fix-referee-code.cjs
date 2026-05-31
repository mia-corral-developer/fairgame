const { initializeApp } = require('firebase/app')
const { getDatabase, ref, get, update } = require('firebase/database')

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

async function fixRefereeCode(sessionCode) {
  console.log(`🔍 Buscando sesión: ${sessionCode}`)

  // Get session ID from code
  const codeSnap = await get(ref(db, `sessionCodes/${sessionCode.toUpperCase()}`))
  if (!codeSnap.exists()) {
    console.log('❌ Sesión no encontrada')
    process.exit(1)
  }

  const sessionId = codeSnap.val()
  console.log(`✅ Session ID: ${sessionId}`)

  // Get session data
  const sessionSnap = await get(ref(db, `sessions/${sessionId}`))
  if (!sessionSnap.exists()) {
    console.log('❌ Datos de sesión no encontrados')
    process.exit(1)
  }

  const session = sessionSnap.val()
  console.log(`📋 Nombre: ${session.name}`)
  console.log(`🔒 Código árbitro actual: ${session.refereeCode || 'NO TIENE'}`)

  // Generate and set referee code if missing
  if (!session.refereeCode) {
    const newCode = String(Math.floor(1000 + Math.random() * 9000))
    await update(ref(db, `sessions/${sessionId}`), { refereeCode: newCode })
    console.log(`\n✅ Nuevo código de árbitro asignado: ${newCode}`)
  } else {
    console.log(`\n✅ La sesión ya tiene código de árbitro: ${session.refereeCode}`)
  }

  // Verify
  const verifySnap = await get(ref(db, `sessions/${sessionId}`))
  const verify = verifySnap.val()
  console.log(`\n📱 Código sesión: ${verify.code}`)
  console.log(`🔒 Código árbitro: ${verify.refereeCode}`)
  console.log(`\n🔗 Panel árbitro: https://fairgame-rouge.vercel.app/referee`)

  process.exit(0)
}

fixRefereeCode('4CREXW').catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
