import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'

export default function Rules() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6 pt-4">
      <button onClick={() => navigate('/')} className="self-start text-sm text-gray-400 hover:text-white cursor-pointer">
        ← Volver
      </button>

      <h2 className="text-2xl font-bold text-white">📋 Reglas de juego</h2>

      <div className="flex flex-col gap-4">
        {/* Cola Clásica */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-3 text-lg font-bold text-[#e94560]">🏐 Cola clásica</h3>
          <p className="mb-3 text-sm text-gray-400">
            Ideal para eventos informales donde todos quieren jugar. El equipo que gana se
            mantiene en la cancha y el que pierde va al final de la cola. ¡Pero ojo con el límite
            de partidos seguidos!
          </p>

          <ul className="flex flex-col gap-2 text-sm text-gray-300">
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>Equipos <strong>fijos</strong>: una vez registrado, el equipo no puede modificarse. Si editas jugadores, hay penalización.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>Un jugador <strong>NO puede estar en dos equipos</strong> al mismo tiempo. Los equipos deben tener jugadores completamente distintos.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>El primer equipo de la cola juega contra el segundo.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>El <strong>perdedor</strong> va al <strong>final de la cola</strong>.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>El <strong>ganador</strong> se queda en la cancha y pasa al frente de la cola.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span><strong>Límite de partidos consecutivos</strong>: máximo 2 seguidos (4 equipos) o 3 seguidos (5+ equipos).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>Si un equipo gana y <strong>alcanza el límite de partidos consecutivos</strong>, ese equipo va a la <strong>mitad de la cola</strong> (no al final, no se queda). Esto da oportunidad a todos de jugar.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span><strong>Penalización por editar equipo</strong>: si un equipo modifica sus jugadores después de registrarse, ese equipo es enviado automáticamente al <strong>final de la cola</strong> como penalización por alterar la configuración en medio del torneo.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>Límite de puntos dinámico: 15 puntos (4 equipos), 12 puntos (5-6 equipos), 10 puntos (7+ equipos).</span>
            </li>
          </ul>
        </div>

        {/* Todos contra todos */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-3 text-lg font-bold text-[#e94560]">🏆 Todos contra todos</h3>
          <p className="mb-3 text-sm text-gray-400">
            Cada equipo juega contra todos los demás una vez. Gana quien acumule más
            victorias al finalizar todos los enfrentamientos.
          </p>

          <ul className="flex flex-col gap-2 text-sm text-gray-300">
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>Equipos <strong>fijos</strong>: una vez registrado, el equipo no puede modificarse.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>Un jugador <strong>NO puede estar en dos equipos</strong> al mismo tiempo.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>El sistema genera un calendario de partidos automáticamente.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>Cada equipo juega exactamente una vez contra cada rival.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>Límite de puntos: 15 puntos (4 equipos), 12 puntos (5-6 equipos), 10 puntos (7+ equipos).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>Clasificación: 2 puntos por victoria, 0 por derrota.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e94560]">•</span>
              <span>Desempate: diferencia de puntos total, luego puntos a favor.</span>
            </li>
          </ul>
        </div>
      </div>

      <Button onClick={() => navigate('/')} variant="secondary">
        Volver al inicio
      </Button>
    </div>
  )
}
