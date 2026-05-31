# FairGame — Torneo: Todos contra todos con Fase de Grupos + Eliminatoria

## Estado actual
El modo `round-robin` funciona como un "modo cola sin rotación": el árbitro inicia partidos manualmente tomando equipos de la `queue`. No hay fixture generado, no hay tabla de posiciones, no hay fases. Solo una cola plana de partidos.

---

## Objetivo
Reemplazar el modo `round-robin` actual por un **torneo estructurado**:

### Flujo del torneo

```
FASE DE GRUPOS (round-robin)
  ├─ 4 equipos por grupo
  ├─ Cada equipo juega 1 vez vs cada rival del grupo
  ├─ Tabla de posiciones en vivo (wins, diff, points for)
  └─ Límite de puntos por partido: 30

CUANDO TERMINAN LOS GRUPOS → BRACKET ELIMINATORIO
  ├─ Semifinal 1: 1° del grupo vs 4° del grupo
  ├─ Semifinal 2: 2° del grupo vs 3° del grupo
  └─ Final: Ganador SF1 vs Ganador SF2
```

### Reglas (texto en UI)

- Edición de equipos: una vez registrado, el capitán puede editar la información del equipo utilizando su PIN correspondiente.
- Un jugador NO puede estar en dos equipos al mismo tiempo.
- El sistema genera un calendario de partidos automáticamente.
- Límite de puntos: 30 puntos.
- Desempate: diferencia de puntos total, luego puntos a favor.

---

## Fases de implementación

---

### PHASE 1 — Modelo de datos + Creación de sesión
**Scope:** Definir cómo se guarda la estructura del torneo en Firebase. Actualizar `createSession`.

**Cambios en Firebase:**
```
sessions/{sessionId}/
  ├── ...campos existentes...
  ├── phase: "group" | "semifinals" | "final" | "completed"
  ├── groupMatches: {
  │     matchId: {
  │       id, teamA, teamB,
  │       status: "scheduled" | "playing" | "finished",
  │       scoreA, scoreB, winner, playedAt
  │     }
  │   }
  ├── knockoutMatches: {
  │     semifinal1: { ...},
  │     semifinal2: { ...},
  │     final: { ...}
  │   }
  ├── standings: {
  │     teamId: { wins, played, pointsFor, pointsAgainst }
  │   }
  └── bracket: {
        semifinal1: { teamA, teamB, winner, status },
        semifinal2: { ... },
        final: { ... }
      }
```

**Cambios en código:**
- `sessionService.js`: `createSession` para `round-robin` → inicializa `phase: "group"`, vacíos `groupMatches`, `standings`, `bracket`
- Quitar `queue` del round-robin (se mantiene solo para queue mode)

---

### PHASE 2 — Generación automática del fixture de grupos

**Scope:** Cuando el árbitro inicia el torneo (primer partido), generar TODOS los enfrentamientos del grupo.

**Fórmula round-robin (4 equipos):**
- Equipos: A, B, C, D
- Partidos: A vs B, A vs C, A vs D, B vs C, B vs D, C vs D → **6 partidos**

**Lógica:**
```js
function generateGroupMatches(teamIds) {
  const matches = []
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matches.push({
        id: generateId(),
        teamA: teamIds[i],
        teamB: teamIds[j],
        status: "scheduled",
        scoreA: 0, scoreB: 0,
      })
    }
  }
  return shuffle(matches) // Sorteo aleatorio del orden de partidos
}
```

**Cambios en código:**
- `sessionService.js`: Nuevas funciones: `generateGroupMatches`, `getNextGroupMatch`
- `RefereeDashboard.jsx`: En `startMatch`, si `phase === "group"` → generar fixture si aún no existe, luego iniciar el primer partido no jugado

---

### PHASE 3 — Jugar partidos de grupo + Standings en vivo

**Scope:** Cada vez que termina un partido, actualizar standings y permitir iniciar el siguiente.

**Standings por equipo:**
```js
standings[teamId] = {
  wins: number,
  played: number,
  pointsFor: number,    // puntos anotados total
  pointsAgainst: number // puntos recibidos total
}
```

**Lógica al finalizar partido:**
```js
async function finishGroupMatch(sessionId, matchId, winnerId, scoreA, scoreB) {
  // 1. Marcar partido como finished
  // 2. Actualizar standings del ganador
  // 3. Actualizar standings del perdedor
  // 4. Revisar si quedan partidos por jugar
  // 5. Si todos terminados → transitionToSemifinals()
}
```

**Desempate para clasificación:**
```
1. Wins (más victorias)
2. Diff (pointsFor - pointsAgainst, más alto)
3. PointsFor (más alto)
```

**Cambios en código:**
- `sessionService.js`: `finishGroupMatch`, `updateStandings`, `getStandingsOrdered`
- `RefereeDashboard.jsx`: Botón "Iniciar partido" usa fixture en vez de queue
- `SpectatorView.jsx`: Mostrar tabla de posiciones debajo del partido actual

---

### PHASE 4 — Transición automática: Grupos → Semifinales

**Scope:** Cuando terminan todos los partidos de grupo, armar automáticamente las semifinales.

**Lógica:**
```js
async function transitionToSemifinals(sessionId) {
  const standings = getStandingsOrdered(sessionId) // [1°, 2°, 3°, 4°]
  const bracket = {
    semifinal1: {
      label: 'Semifinal 1',
      teamA: standings[0].teamId, // 1°
      teamB: standings[3].teamId, // 4°
      status: 'scheduled',
      winner: null,
    },
    semifinal2: {
      label: 'Semifinal 2',
      teamA: standings[1].teamId, // 2°
      teamB: standings[2].teamId, // 3°
      status: 'scheduled',
      winner: null,
    },
    final: {
      label: 'Final',
      teamA: null,
      teamB: null,
      status: 'waiting',
      winner: null,
    }
  }
  await update(sessionRef, { phase: 'semifinals', bracket })
}
```

**Cambios en código:**
- `sessionService.js`: `transitionToSemifinals`
- `RefereeDashboard.jsx`: Detectar transición, mostrar "Fase: Semifinales", permitir iniciar SF1 o SF2

---

### PHASE 5 — Semifinales + Transición a Final

**Scope:** Jugar las dos semifinales. Cuando ambas terminan, armar la final automáticamente.

**Lógica:**
```js
async function transitionToFinal(sessionId) {
  const bracket = session.bracket
  const final = {
    label: 'Final',
    teamA: bracket.semifinal1.winner,
    teamB: bracket.semifinal2.winner,
    status: 'scheduled',
    winner: null,
  }
  await update(sessionRef, { phase: 'final', 'bracket/final': final })
}
```

**Cambios en código:**
- `sessionService.js`: `finishKnockoutMatch`, `transitionToFinal`
- `RefereeDashboard.jsx`: Mostrar bracket visual, iniciar semifinales/final
- `SpectatorView.jsx`: Mostrar bracket (árbol eliminatorio)

---

### PHASE 6 — Final + Torneo completado

**Scope:** Jugar la final, declarar campeón, marcar torneo como completado.

**Lógica:**
```js
async function finishTournament(sessionId, winnerId) {
  await update(sessionRef, {
    phase: 'completed',
    'bracket/final/winner': winnerId,
    'bracket/final/status': 'finished',
    champion: winnerId,
  })
}
```

**Cambios en código:**
- `sessionService.js`: `finishTournament`
- `SpectatorView.jsx`: Pantalla de campeón cuando `phase === "completed"`

---

## Archivos a modificar

| Archivo | Fases |
|---------|-------|
| `src/services/sessionService.js` | 1, 2, 3, 4, 5, 6 |
| `src/pages/RefereeDashboard.jsx` | 2, 3, 4, 5, 6 |
| `src/pages/SpectatorView.jsx` | 3, 4, 5, 6 |
| `src/pages/Rules.jsx` | 1 |
| `src/pages/CreateSession.jsx` | 1 (validar mínimo 4 equipos para round-robin) |

---

## Notas de arquitectura

- El `round-robin` actual usa `session.queue` → se **reemplaza** por `session.groupMatches`
- `currentMatch` sigue existiendo como el partido activo (sea de grupo, semifinal o final)
- `matches` (historial) sigue existiendo, pero los partidos del torneo están indexados en `groupMatches` y `bracket`
- El árbitro solo presiona "Iniciar partido", el sistema decide cuál es el siguiente basado en la fase
