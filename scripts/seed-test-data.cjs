const { initializeApp } = require('firebase/app')
const { getDatabase, ref, set, push, update } = require('firebase/database')

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

const EQUIPOS = [
  {
    name: 'Los Toros',
    city: 'Bogotá',
    players: ['Carlos Ruiz', 'Andrés Corral', 'Juan Pérez', 'Luis Martínez', 'Pedro Gómez', 'Diego López'],
  },
  {
    name: 'Las Águilas',
    city: 'Medellín',
    players: ['María Santos', 'Ana López', 'Laura Torres', 'Carmen Díaz', 'Sofía Herrera', 'Valentina Ríos'],
  },
  {
    name: 'Los Leones',
    city: 'Cali',
    players: ['Miguel Ángel', 'José García', 'Fernando Castro', 'Ricardo Morales', 'Alejandro Vargas', 'Sebastián Núñez'],
  },
  {
    name: 'Los Tiburones',
    city: 'Barranquilla',
    players: ['Roberto Silva', 'Javier Ortega', 'Daniel Flores', 'Gabriel Mendoza', 'Tomás Aguilar', 'Lucas Ramírez'],
  },
  {
    name: 'Los Halcones',
    city: 'Cartagena',
    players: ['Mateo Cruz', 'Santiago Reyes', 'Emiliano Guerrero', 'Maximiliano Soto', 'Benjamín Peña', 'Joaquín Delgado'],
  },
]

async function seedDatabase() {
  console.log('🌱 Creando sesión de prueba...')

  const sessionRef = push(ref(db, 'sessions'))
  const sessionId = sessionRef.key
  const code = generateSessionCode()
  const refereeCode = generateTeamPin()

  const sessionData = {
    id: sessionId,
    name: 'Torneo de Prueba QA',
    mode: 'queue',
    code,
    refereeCode,
    status: 'waiting',
    createdAt: Date.now(),
    teamCount: 5,
    currentMatch: null,
    queue: [],
    standings: {},
    pointsToWin: 12,
    maxConsecutiveWins: 3,
  }

  await set(sessionRef, sessionData)
  await set(ref(db, `sessionCodes/${code}`), sessionId)

  console.log(`✅ Sesión creada: ${sessionId}`)
  console.log(`📋 Código de sesión: ${code}`)
  console.log(`🔒 Código de árbitro: ${refereeCode}`)

  const queue = []

  for (const equipo of EQUIPOS) {
    const teamRef = push(ref(db, `sessions/${sessionId}/teams`))
    const teamId = teamRef.key
    const pin = generateTeamPin()

    const teamData = {
      id: teamId,
      name: equipo.name,
      city: equipo.city,
      players: equipo.players,
      pin,
      wins: 0,
      losses: 0,
      consecutiveWins: 0,
      totalPoints: 0,
      createdAt: Date.now(),
    }

    await set(teamRef, teamData)
    queue.push(teamId)

    console.log(`  ✅ Equipo: ${equipo.name} (PIN: ${pin})`)
  }

  await update(ref(db, `sessions/${sessionId}`), { queue })

  console.log('\n🎉 Datos de prueba creados exitosamente!')
  console.log(`\n🔗 URLs de prueba:`)
  console.log(`  Espectador: https://fairgame-rouge.vercel.app/spectator/${code}`)
  console.log(`  Árbitro: https://fairgame-rouge.vercel.app/referee`)
  console.log(`\n📱 Código para unirse: ${code}`)
  console.log(`🔒 Código de árbitro: ${refereeCode}`)

  process.exit(0)
}

seedDatabase().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
