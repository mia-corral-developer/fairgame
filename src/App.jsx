import { Routes, Route } from 'react-router-dom'
import { SessionProvider } from './contexts/SessionContext'
import Home from './pages/Home'
import CreateSession from './pages/CreateSession'
import JoinSession from './pages/JoinSession'
import CreateTeam from './pages/CreateTeam'
import RefereeDashboard from './pages/RefereeDashboard'
import SpectatorView from './pages/SpectatorView'
import TeamEdit from './pages/TeamEdit'
import EditTeam from './pages/EditTeam'
import ShareSession from './pages/ShareSession'
import Rules from './pages/Rules'
import ActiveSessions from './pages/ActiveSessions'
import SessionMenu from './pages/SessionMenu'

export default function App() {
  return (
    <SessionProvider>
      <div className="mx-auto w-full max-w-[420px] flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateSession />} />
          <Route path="/join" element={<JoinSession />} />
          <Route path="/create-team" element={<CreateTeam />} />
          <Route path="/team-edit" element={<TeamEdit />} />
          <Route path="/edit-team" element={<EditTeam />} />
          <Route path="/share" element={<ShareSession />} />
          <Route path="/referee" element={<RefereeDashboard />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/sessions" element={<ActiveSessions />} />
          <Route path="/session/:code" element={<SessionMenu />} />
          <Route path="/spectator/:code" element={<SpectatorView />} />
          <Route path="/spectator" element={<SpectatorView />} />
        </Routes>
      </div>
    </SessionProvider>
  )
}
