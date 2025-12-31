import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import FilesPage from './pages/FilesPage'
import LogsPage from './pages/LogsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/files" replace />} />
                <Route path="files" element={<FilesPage />} />
                <Route path="files/*" element={<FilesPage />} />
                <Route path="logs" element={<LogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>
        </Routes>
    )
}

export default App
