import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'

export default function ShareSession() {
  const navigate = useNavigate()
  const location = useLocation()
  const { code, name, mode, refereeCode } = location.state || {}

  const modeLabel = mode === 'queue' ? 'Cola clásica' : 'Todos contra todos'
  const shareText = `🏐 Únete a "${name}" en FairGame\n\nModo: ${modeLabel}\nCódigo: ${code}\n\nIngresa el código en: ${window.location.origin}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FairGame - ${name}`,
          text: shareText,
        })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      alert('Código copiado al portapapeles')
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(code)
    alert('Código copiado: ' + code)
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h2 className="text-2xl font-bold text-white">¡Sesión creada!</h2>

      <div className="rounded-2xl border border-[#e94560]/30 bg-[#e94560]/10 p-6 text-center">
        <p className="text-sm text-gray-400">Código de sesión</p>
        <p className="mt-2 text-5xl font-black tracking-widest text-[#e94560]">{code}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-gray-300">
          <span className="font-semibold">Campeonato:</span> {name}
        </p>
        <p className="text-sm text-gray-300">
          <span className="font-semibold">Modo:</span> {modeLabel}
        </p>
      </div>

      {refereeCode && (
        <div className="rounded-2xl border border-[#533483]/30 bg-[#533483]/10 p-6 text-center">
          <p className="text-sm text-gray-400">Código de árbitro (solo tú)</p>
          <p className="mt-2 text-4xl font-black tracking-widest text-[#533483]">{refereeCode}</p>
          <p className="mt-2 text-xs text-gray-500">
            Guarda este código. Solo con él puedes acceder al panel de árbitro.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button onClick={handleShare}>📤 Compartir por WhatsApp</Button>
        <Button variant="secondary" onClick={handleCopy}>📋 Copiar código</Button>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <p className="text-center text-sm text-gray-500">¿Qué sigue?</p>
        <Button variant="outline" onClick={() => navigate('/create-team')}>
          Registrar mi equipo
        </Button>
        <Button variant="outline" onClick={() => navigate('/referee')}>
          Ir al panel de árbitro
        </Button>
      </div>
    </div>
  )
}
