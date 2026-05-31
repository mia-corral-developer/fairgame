## FairGame — Fase 1: Estructura Base PWA

### Tarea
Setup completo de un proyecto React PWA mobile-first usando Vite.

### Requisitos Técnicos
1. **Vite + React 19** con template React
2. **Tailwind CSS 4** configurado
3. **PWA** con vite-plugin-pwa (manifest, service worker, iconos placeholder)
4. **Firebase Realtime DB** configurado (dejar placeholders para config)
5. **React Router** para navegación entre pantallas
6. **Estructura de carpetas** según PLAN.md
7. **Estado global**: React Context para auth de sesión (sin login real, solo sesión anónima)

### Estructura de Archivos a Crear
```
/
├── public/
│   ├── icons/ (iconos PWA placeholder 192x192, 512x512)
│   └── manifest.json
├── src/
│   ├── main.jsx
│   ├── App.jsx (router principal)
│   ├── index.css (Tailwind imports)
│   ├── pages/
│   │   ├── Home.jsx (pantalla inicial)
│   │   ├── CreateSession.jsx
│   │   ├── JoinSession.jsx
│   │   ├── CreateTeam.jsx
│   │   ├── RefereeDashboard.jsx
│   │   └── SpectatorView.jsx
│   ├── components/common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   └── ShareButton.jsx
│   ├── contexts/
│   │   └── SessionContext.jsx
│   ├── services/
│   │   └── firebase.js (config placeholder)
│   └── hooks/
│       └── useSession.js
├── index.html (con meta tags PWA)
├── vite.config.js (con PWA plugin)
├── tailwind.config.js
└── package.json
```

### Diseño Visual
- Mobile-first, ancho máximo 420px centrado
- Paleta: #1a1a2e (fondo oscuro), #e94560 (acento rojo), #0f3460 (secundario), #533483 (morado)
- Fuente: system-ui
- Estilo moderno, tarjetas redondeadas, sombras suaves

### Comportamiento
- Al entrar, mostrar Home con botones: "🎮 Crear campeonato" y "🔗 Unirse a sesión"
- Sin funcionalidad real aún, solo estructura y navegación
- Compartir por Web Share API (placeholder)

### Entregable
Código funcional que corra con `npm run dev` y se vea bien en móvil (simulado en Chrome DevTools).
