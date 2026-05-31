import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { subscribeToSession, subscribeToTeams } from '../services/sessionService'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('fg_sessionId'))
  const [teamId, setTeamId] = useState(() => localStorage.getItem('fg_teamId'))
  const [isReferee, setIsReferee] = useState(() => localStorage.getItem('fg_isReferee') === 'true')
  const [sessionData, setSessionData] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(false)

  // Subscribe to session changes
  useEffect(() => {
    if (!sessionId) {
      setSessionData(null)
      setTeams([])
      return
    }

    setLoading(true)
    const unsubSession = subscribeToSession(sessionId, (data) => {
      setSessionData(data)
      setLoading(false)
    })

    const unsubTeams = subscribeToTeams(sessionId, (teamsList) => {
      setTeams(teamsList)
    })

    return () => {
      unsubSession()
      unsubTeams()
    }
  }, [sessionId])

  const joinSession = useCallback((id) => {
    setSessionId(id)
    localStorage.setItem('fg_sessionId', id)
  }, [])

  const setTeam = useCallback((id) => {
    setTeamId(id)
    localStorage.setItem('fg_teamId', id)
  }, [])

  const setReferee = useCallback((value) => {
    setIsReferee(value)
    localStorage.setItem('fg_isReferee', String(value))
  }, [])

  const clearSession = useCallback(() => {
    setSessionId(null)
    setTeamId(null)
    setIsReferee(false)
    setSessionData(null)
    setTeams([])
    localStorage.removeItem('fg_sessionId')
    localStorage.removeItem('fg_teamId')
    localStorage.removeItem('fg_isReferee')
  }, [])

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        teamId,
        isReferee,
        sessionData,
        teams,
        loading,
        joinSession,
        setTeam,
        setReferee,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSessionContext must be used within SessionProvider')
  return ctx
}
