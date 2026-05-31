## Plan de Implementación — FairGame

### Fase 1: Estructura Base PWA (Hoy)
- [ ] Setup Vite + React + Tailwind + PWA (workbox/vite-plugin-pwa)
- [ ] Crear modelo de datos (Firebase config + schema)
- [ ] Setup Firebase Realtime Database
- [ ] Crear servicios base: sessionService, teamService, matchService, refereeService
- [ ] Crear layout base (mobile-first)

### Fase 2: Flujo Principal — Crear Sesión + Registrar Equipos
- [ ] Pantalla Home: Crear campeonato / Unirse a sesión
- [ ] Crear equipo (nombre + jugadores + PIN)
- [ ] Compartir por WhatsApp (Web Share API)
- [ ] Vista Capitán: editar equipo con PIN
- [ ] Vista árbitro: ingresar código de sesión

### Fase 3: Modo Cola Clásica
- [ ] Algoritmo de cola FIFO
- [ ] Pantalla marcador (árbitro): +1, deshacer, siguiente partido
- [ ] Lógica de rotación: ganador se queda, perdedor al final
- [ ] Límite consecutivo (2-3 partidos según cantidad equipos)
- [ ] Pantalla espectador: cola en vivo + tiempo estimado
- [ ] Puntos dinámicos (15/12/10 según equipos)

### Fase 4: Modo Round-Robin
- [ ] Generación automática de bracket
- [ ] Standings con streak bonus
- [ ] Anti-monopolio (descanso obligatorio en streak 3)
- [ ] Fase de grupos (6+ equipos)
- [ ] Criterios de desempate
- [ ] Pantalla espectador: standings + bracket

### Fase 5: Finalización
- [ ] Offline cache (service worker)
- [ ] Testing en dispositivos reales
- [ ] Deploy a Vercel / Firebase
- [ ] Iconos PWA + manifest
