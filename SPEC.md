# FairGame — SPEC (Estado Actual)

**Última actualización:** 2026-06-01  
**Archivo:** `/opt/data/fairgame/SPEC.md`

---

## 1. Visión General

FairGame es una PWA mobile-first para gestionar torneos informales de vóleibol. Permite crear sesiones de torneo, registrar equipos con PINs, gestionar partidos en tiempo real y visualizar standings.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | React 19 + Vite 6 |
| Estilos | Tailwind CSS v4 |
| Router | React Router DOM v7 |
| Backend/DB | Firebase Realtime Database |
| PWA | vite-plugin-pwa + Workbox |
| Deploy | Vercel (mia-corral team) |

---

## 3. Modos de Juego

### 3.1 Cola Clásica (Queue/FIFO)
- Equipos se registran con PIN de 4 dígitos
- Sistema de cola FIFO con rotación automática
- Puntos dinámicos según cantidad de equipos (15/12/10)
- Límite de victorias consecutivas antes de ir al fondo de la cola

### 3.2 Todos contra Todos (Round-Robin)
- Máximo 4 equipos
- 6 partidos de fase de grupos (todos vs todos)
- Top 2 avanzan a semifinales
- Sistema de bracket: semifinales → final

---

## 4. Estructura de Rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | Home | Landing + acceso a sesiones |
| `/create` | CreateSession | Crear nueva sesión de torneo |
| `/join` | JoinSession | Unirse como equipo con código |
| `/create-team` | CreateTeam | Registrar equipo en sesión |
| `/team-edit` | TeamEdit | Panel del equipo (score + editar) |
| `/edit-team` | EditTeam | Editar jugadores del equipo |
| `/share` | ShareSession | Compartir código de sesión |
| `/referee` | RefereeDashboard | Panel del árbitro (organizador) |
| `/rules` | Rules | Reglas del torneo |
| `/sessions` | ActiveSessions | Sesiones activas públicas |
| `/session/:code` | SessionMenu | Menú principal de la sesión |
| `/spectator/:code` | SpectatorView | Vista de espectador |

---

## 5. Servicios (Firebase)

### 5.1 `firebase.js`
- Inicializa Firebase App + Realtime Database
- Exporta `getFirebaseDB()` para uso en servicios

### 5.2 `sessionService.js`
Funciones principales:
- `createSession({ name, mode })` — Crea sesión con código aleatorio
- `getSessionByCode(code)` — Busca sesión por código
- `subscribeToSession(sessionId, callback)` — Listener en tiempo real
- `createTeam({ sessionId, name, players })` — Registra equipo con PIN
- `subscribeToTeams(sessionId, callback)` — Listener de equipos
- `createMatch({ sessionId, teamA, teamB })` — Inicia partido (modo cola)
- `finishMatch(sessionId, matchId, winnerTeamId)` — Finaliza partido (modo cola)
- `updateMatchScore(sessionId, matchId, { scoreA, scoreB })` — Actualiza marcador
- `rotateQueue(sessionId, winner, loser)` — Rota cola post-partido
- `subscribeToCurrentMatch(sessionId, callback)` — Listener del partido actual
- `clearCurrentMatch(sessionId)` — Limpia partido actual
- `initGroupMatches(sessionId)` — Genera fixture round-robin
- `getNextTournamentMatch(sessionId)` — Obtiene siguiente partido del fixture
- `createTournamentMatch({ sessionId, matchId, teamA, teamB })` — Inicia partido torneo
- `finishGroupMatch(sessionId, matchId, winnerTeamId, scoreA, scoreB)` — Finaliza grupo
- `finishKnockoutMatch(sessionId, bracketKey, winnerTeamId, scoreA, scoreB)` — Finaliza bracket
- `getOrderedStandings(sessionId)` — Retorna standings ordenados
- `transitionToSemifinals(sessionId)` — Avanza a semifinales
- `transitionToFinal(sessionId)` — Avanza a final

### 5.3 Funciones pendientes de deploy
- `shuffleGroupMatches(sessionId)` — Sortea aleatoriamente el orden de los 6 partidos de la fase de grupos. Solo permitido antes de iniciar el primer partido. *(Implementada en código fuente pero no en producción)*

---

## 6. Estado de Funcionalidades

### ✅ Implementado y en producción
- [x] Crear sesión (cola y round-robin)
- [x] Compartir código de sesión (QR + enlace)
- [x] Registrar equipos con PIN de 4 dígitos
- [x] Panel de árbitro con autenticación por PIN
- [x] Iniciar y finalizar partidos
- [x] Sistema de cola FIFO con rotación automática
- [x] Modo round-robin con fase de grupos + bracket
- [x] Tabla de posiciones en tiempo real
- [x] Semifinales y final automáticas
- [x] Vista de espectador
- [x] Sesiones públicas activas
- [x] Editar equipo (con penalización de cola)
- [x] PWA installable con service worker

### ✅ Implementado y en producción (deploy 2026-06-01)
- [x] **Botón "🎲 Sortear fixture"** — Mezcla aleatoriamente el orden de los 6 partidos de la fase de grupos antes de iniciar el primer partido
- [x] **Login de árbitro simplificado** — El campo de código de sesión se oculta cuando viene por query param (`?session=XXX`), solo pide PIN de árbitro
- [x] **Forzar limpieza de caché PWA** — Meta tags no-cache, workbox `cleanupOutdatedCaches`, y script de auto-reload del SW

### ❌ Pendiente por implementar
- [ ] Configuración personalizable de puntos por modo
- [ ] Historial de partidos completados
- [ ] Exportar resultados del torneo
- [ ] Soporte para múltiples canchas simultáneas

---

## 7. Arquitectura de Datos (Firebase)

```
sessions/
  {sessionId}/
    id, name, mode, code, refereeCode, status
    createdAt, teamCount
    currentMatch: { teamA, teamB, matchId }
    queue: [teamId, ...]
    pointsToWin, maxConsecutiveWins
    phase: 'group' | 'semifinals' | 'final' | 'completed'
    groupMatches: { matchId: { teamA, teamB, status, scoreA, scoreB, winner } }
    bracket: { semifinal1, semifinal2, final }
    standings: { teamId: { wins, played, pointsFor, pointsAgainst } }

teams/
  {teamId}/
    id, sessionId, name, players[], captain, pin
    wins, losses, consecutiveWins, totalPoints
    createdAt

sessionCodes/
  {code} -> sessionId
```

---

## 8. Flujo de Usuario

### 8.1 Organizador
1. Crea sesión → obtiene código (ej: DB76W6) + PIN de árbitro
2. Comparte código con equipos
3. Accede a `/referee` → ingresa código de sesión + PIN
4. Inicia partidos y registra puntos
5. Sistema avanza automáticamente entre fases

### 8.2 Equipos
1. Reciben código de sesión
2. Acceden a `/join` → ingresan código
3. Crean equipo con jugadores + capitán
4. Usan `/team-edit` para ver marcador en vivo

### 8.3 Espectadores
1. Acceden a `/spectator/:code`
2. Ven marcador y standings en tiempo real sin autenticación

---

## 9. Problemas Conocidos

### Issue #1: Deploy no incluye cambios recientes ✅ RESUELTO
**Severidad:** Alta  
**Descripción:** Los cambios aplicados al código fuente no aparecían en el bundle de producción de Vercel.  
**Causa raíz:** Vercel projects vinculados a GitHub ignoran archivos locales no commiteados. `npx vercel --prod` hace build desde el repo remoto, no desde `dist/` local.  
**Solución:** Usar flujo `vercel build --prod` + `vercel deploy --prebuilt --prod` para forzar deploy del artefacto local.  
**Deploy exitoso:** 2026-06-01 — https://fairgame-rouge.vercel.app

---

## 10. Configuración de Deploy

```bash
# Vercel CLI (token con permisos)
export VERCEL_TOKEN="vcp_4f0ogivLeFzOvaMG7QGJcwujuaEcPU6IMF5fdlmb9tgDUMCmeH2n57s4"

# Deploy producción
npx vercel --prod --yes --token $VERCEL_TOKEN
```

**URL producción actual:** https://fairgame-rouge.vercel.app  
**URL proyecto nuevo:** https://fairgame-fresh.vercel.app

---

## 11. Reglas de Firebase (Desarrollo)

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ Abrir solo en desarrollo. En producción restringir por auth.

---

*SPEC mantenido por el equipo técnico. Actualizar tras cada deploy exitoso.*
