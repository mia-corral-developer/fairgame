import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getSessionByCode } from '../services/sessionService'
import { useSessionContext } from '../contexts/SessionContext'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

export default function JoinSession() {
  const navigate = useNavigate()
  const location = useLocation()
  const { joinSession } = useSessionContext()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Prefill code if passed from SessionMenu
  useEffect(() => {
    const prefill = location.state?.prefillCode
    if (prefill) {
      setCode(prefill)
    }
  }, [location.state])

  async function handleJoin() {
    if (!code.trim()) {
      setError('Ingresa el código de sesión')
      return
    }

    setLoading(true)
    setError('')

    try {
      const session = await getSessionByCode(code.trim().toUpperCase())
      if (!session) {
        setError('Código no encontrado. Verifica e intenta de nuevo.')
        return
      }

      joinSession(session.id)
      navigate('/create-team')
    } catch (err) {
      setError('Error al buscar la sesión. Intenta de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <button onClick={() => navigate('/')} className="self-start text-sm text-gray-400 hover:text-white cursor-pointer">
        ← Volver
      </button>

      <h2 className="text-2xl font-bold text-white">Unirse a sesión</h2>

      <Input
        label="Código de sesión"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Ej: ABC123"
        maxLength={6}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button onClick={handleJoin} disabled={loading}>
        {loading ? 'Buscando...' : 'Unirse'}
      </Button>
    </div>
  )
}
