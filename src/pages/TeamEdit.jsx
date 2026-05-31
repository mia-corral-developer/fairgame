import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSessionContext } from '../contexts/SessionContext'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

export default function TeamEdit() {
  const navigate = useNavigate()
  const location = useLocation()
  const { pin, teamName, isNew } = location.state || {}
  const { sessionData, teams, teamId } = useSessionContext()

  const [showPin, setShowPin] = useState(false)
  const team = teams.find((t) => t.id === teamId)

  return (
    <div className="flex flex-col gap-6 pt-4">
      <button onClick={() => navigate('/')} className="self-start text-sm text-gray-400 hover:text-white cursor-pointer">
        ← Volver al inicio
      </button>

      <h2 className="text-2xl font-bold text-white">
        {isNew ? '¡Equipo registrado!' : 'Mi equipo'}
      </h2>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-gray-400">Equipo</p>
        <p className="text-2xl font-bold text-white">{team?.name || teamName}</p>

        {isNew && (
          <>
            <div className="mt-4 rounded-xl border border-[#533483]/30 bg-[#533483]/10 p-4">
              <p className="text-sm text-gray-400">PIN de acceso (guárdalo)</p>
              <div className="mt-1 flex items-center gap-3">
                <p className="text-3xl font-black tracking-widest text-[#533483]">
                  {showPin ? pin : '••••'}
                </p>
                <button
                  onClick={() => setShowPin(!showPin)}
                  className="text-sm text-gray-400 hover:text-white cursor-pointer"
                >
                  {showPin ? '🙈 Ocultar' : '👁️ Mostrar'}
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Este PIN te permite editar tu equipo más tarde. No lo compartas si no quieres que otros editen.
            </p>
          </>
        )}
      </div>

      {team?.players && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-medium text-gray-300">Jugadores</p>
          <ul className="mt-2 flex flex-col gap-2">
            {team.players.map((player, i) => {
              const playerName = typeof player === 'string' ? player : player.name
              const playerPhone = typeof player === 'string' ? '' : player.phone
              const isCaptain = typeof player === 'string' ? false : player.isCaptain
              return (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="w-5 text-xs text-gray-600">{i + 1}</span>
                  <span className="flex-1">
                    {playerName}
                    {isCaptain && (
                      <span className="ml-2 text-xs text-[#e94560]">⭐ Capitán</span>
                    )}
                  </span>
                  {playerPhone && (
                    <span className="text-xs text-gray-600">{playerPhone}</span>
                  )}
                </li>
              )
            })}
          </ul>
          {team.captain && (
            <p className="mt-3 text-xs text-gray-500">
              Capitán: <span className="text-[#e94560]">{team.captain}</span>
            </p>
          )}
        </div>
      )}

      {sessionData && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-medium text-gray-300">Campeonato</p>
          <p className="text-lg font-semibold text-white">{sessionData.name}</p>
          <p className="text-sm text-gray-400">
            Modo: {sessionData.mode === 'queue' ? 'Cola clásica' : 'Todos contra todos'}
          </p>
          <p className="text-sm text-gray-400">
            Equipos: {sessionData.teamCount || 0}
          </p>
        </div>
      )}

      {sessionData?.mode === 'queue' && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
          <p className="text-xs text-yellow-200">
            ⚠️ Si editas jugadores después, tu equipo irá al final de la cola como penalización.
          </p>
        </div>
      )}

      <Button onClick={() => navigate('/edit-team')}>
        ✏️ Editar equipo
      </Button>

      <Button onClick={() => navigate('/')} variant="secondary">
        Volver al inicio
      </Button>
    </div>
  )
}
