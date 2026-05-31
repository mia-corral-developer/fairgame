const { initializeApp } = require('firebase/app')
const { getDatabase, ref, set, push, update } = require('firebase/database')

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
  {
    name: 'Los Pumas',
    city: 'Bucaramanga',
    players: ['Nicolás Herrera', 'Martín Castillo', 'Bruno Vargas', 'Thiago Morales', 'Dante Flores', 'Iker Mendoza'],
  },
]

async function createSessionWithTeams({ name, mode }) {
  const sessionRef = push(ref(db, 'sessions'))
  const sessionId = sessionRef.key
  const code = generateSessionCode()
  const refereeCode = generateTeamPin()

  const pointsToWin = mode === 'queue' ? 12 : 15
  const maxConsecutiveWins = mode === 'queue' ? 3 : 0

  const sessionData = {
    id: sessionId,
    name,
    mode,
    code,
    refereeCode,
    status: 'waiting',
    createdAt: Date.now(),
    teamCount: 6,
    currentMatch: null,
    queue: [],
    standings: {},
    pointsToWin,
    maxConsecutiveWins,
  }

  await set(sessionRef, sessionData)
  await set(ref(db, `sessionCodes/${code}`), sessionId)

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
  }

  await update(ref(db, `sessions/${sessionId}`), { queue })

  return { sessionId, code, refereeCode, name, mode }
}

async function main() {
  console.log('🌱 Creando sesiones de prueba...\n')

  // 1. Cola clásica
  const queueSession = await createSessionWithTeams({
    name: 'Torneo Cola Clásica',
    mode: 'queue',
  })

  console.log('🏐 MODO COLA CLÁSICA')
  console.log(`   Nombre: ${queueSession.name}`)
  console.log(`   Código: ${queueSession.code}`)
  console.log(`   🔒 Código árbitro: ${queueSession.refereeCode}`)
  console.log(`   Equipos: 6`)
  console.log(`   Puntos para ganar: 12`)
  console.log(`   Límite consecutivo: 3`)
  console.log()

  // 2. Todos contra todos
  const rrSession = await createSessionWithTeams({
    name: 'Torneo Todos Contra Todos',
    mode: 'round-robin',
  })

  console.log('🏆 MODO TODOS CONTRA TODOS')
  console.log(`   Nombre: ${rrSession.name}`)
  console.log(`   Código: ${rrSession.code}`)
  console.log(`   🔒 Código árbitro: ${rrSession.refereeCode}`)
  console.log(`   Equipos: 6`)
  console.log(`   Puntos para ganar: 15`)
  console.log()

  console.log('🎉 Sesiones creadas exitosamente!')
  console.log()
  console.log('🔗 URLs:')
  console.log()
  console.log('--- COLA CLÁSICA ---')
  console.log(`   Espectador: https://fairgame-rouge.vercel.app/spectator/${queueSession.code}`)
  console.log(`   Árbitro:    https://fairgame-rouge.vercel.app/referee`)
  console.log(`   Código:     ${queueSession.code}`)
  console.log(`   PIN árbitro: ${queueSession.refereeCode}`)
  console.log()
  console.log('--- TODOS CONTRA TODOS ---')
  console.log(`   Espectador: https://fairgame-rouge.vercel.app/spectator/${rrSession.code}`)
  console.log(`   Árbitro:    https://fairgame-rouge.vercel.app/referee`)
  console.log(`   Código:     ${rrSession.code}`)
  console.log(`   PIN árbitro: ${rrSession.refereeCode}`)

  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
