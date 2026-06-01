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
            Torneo tipo Champions: fase de grupos donde todos se enfrentan, seguida de semifinales y final.
            Soporta de 4 a 8+ equipos. El sistema organiza el fixture automáticamente.
          </p>

          {/* Fase 1 */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Fase 1 — Grupos</p>
            <ul className="flex flex-col gap-2 text-sm text-gray-300">
              <li className="flex gap-2">
                <span className="text-[#e94560]">•</span>
                <span>Cada equipo juega contra <strong>todos los demás</strong>, organizado en jornadas.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#e94560]">•</span>
                <span>Con <strong>equipos pares</strong> (4, 6…) todos juegan en cada jornada. Con <strong>equipos impares</strong> (5, 7…) un equipo distinto descansa por jornada.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#e94560]">•</span>
                <span>El árbitro puede <strong>sortear el fixture</strong> antes de iniciar. Esto baraja el orden de las jornadas de forma que ningún equipo juegue dos partidos seguidos.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#e94560]">•</span>
                <span><strong>30 puntos</strong> para ganar cada partido.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#e94560]">•</span>
                <span><strong>Tabla de posiciones</strong>: se ordena por victorias → diferencia de puntos (PF − PC) → puntos a favor (PF).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#e94560]">•</span>
                <span>Al terminar todos los partidos, <strong>los 4 primeros clasifican</strong> a semifinales. El resto queda eliminado.</span>
              </li>
            </ul>
          </div>

          {/* Fase 2 */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Fase 2 — Semifinales</p>
            <ul className="flex flex-col gap-2 text-sm text-gray-300">
              <li className="flex gap-2">
                <span className="text-[#e94560]">•</span>
                <span>Los cruces premian al líder de grupos: <strong>1° vs 4°</strong> y <strong>2° vs 3°</strong>. Terminar primero da el rival más accesible.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#e94560]">•</span>
                <span>Los perdedores de las semifinales quedan eliminados.</span>
              </li>
            </ul>
          </div>

          {/* Fase 3 */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Fase 3 — Final</p>
            <ul className="flex flex-col gap-2 text-sm text-gray-300">
              <li className="flex gap-2">
                <span className="text-[#e94560]">•</span>
                <span>Los dos ganadores de las semifinales se enfrentan. El ganador es el <strong>campeón del torneo</strong>.</span>
              </li>
            </ul>
          </div>

          {/* Tabla explicada */}
          <div className="rounded-xl bg-white/5 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Cómo leer la tabla</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
              <span><strong className="text-white">PJ</strong> — Partidos jugados</span>
              <span><strong className="text-white">PG</strong> — Partidos ganados</span>
              <span><strong className="text-white">PF</strong> — Puntos a favor (anotados)</span>
              <span><strong className="text-white">Diff</strong> — PF menos puntos en contra</span>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={() => navigate('/')} variant="secondary">
        Volver al inicio
      </Button>
    </div>
  )
}
