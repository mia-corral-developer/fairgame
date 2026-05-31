# FairGame — README para OpenCode

## Contexto
PWA mobile-first para gestionar torneos informales de voleibol. Dos modos: Cola Clásica (FIFO) y Round-Robin (standings + streak bonus).

## Stack
- React 19 + Vite + Tailwind CSS
- Firebase Realtime Database (sincronización en tiempo real)
- PWA (workbox/vite-plugin-pwa)

## Estructura
```
src/
  pages/          — Pantallas completas
  components/     — Componentes reutilizables
  services/       — Lógica de negocio + Firebase
  hooks/          — Custom hooks
  utils/          — Helpers (algoritmos de rotación)
```

## Reglas de Código
1. Mobile-first, diseñado para pantallas 375px+
2. Sin librerías UI pesadas (solo Tailwind)
3. Estado global con React Context + Firebase Realtime DB
4. Todos los textos en español
5. Componentes funcionales con hooks

## Firebase Config
Crear proyecto en Firebase → Realtime Database → reglas abiertas (modo desarrollo)

## Tareas
Ver ARCHITECTURE.md para detalle técnico de cada módulo.
