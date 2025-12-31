import { useState, useEffect } from 'react'
import { filesApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import {
    Folder, FolderOpen, ChevronRight, ArrowLeft,
    Home, Loader2, FolderInput, X
} from 'lucide-react'

function FolderBrowserModal({ file, onClose, onMove }) {
    const { theme, accentColor } = useTheme()
    const isDark = theme === 'dark'

    const [currentPath, setCurrentPath] = useState('/')
    const [folders, setFolders] = useState([])
    const [loading, setLoading] = useState(true)
    const [moving, setMoving] = useState(false)
    const [error, setError] = useState(null)

    // Theme colors
    const bgColor = isDark ? 'hsl(222.2 84% 4.9%)' : 'white'
    const borderColor = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)'
    const mutedBg = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(210 40% 96.1%)'
    const textColor = isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
    const mutedText = isDark ? 'hsl(215 20.2% 65.1%)' : 'hsl(215.4 16.3% 46.9%)'
    const overlayBg = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'
    const accentHsl = `hsl(${accentColor.value})`
    const hoverBg = isDark ? 'hsl(217.2 32.6% 12%)' : 'hsl(210 40% 94%)'

    useEffect(() => {
        loadFolders(currentPath)
    }, [currentPath])

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    const loadFolders = async (path) => {
        try {
            setLoading(true)
            setError(null)
            const response = await filesApi.list(path)
            // Filter to only show directories, exclude the file being moved
            const dirs = response.data.files.filter(f =>
                f.is_dir && f.path !== file.path
            )
            setFolders(dirs)
        } catch (err) {
            setError('Failed to load folders')
        } finally {
            setLoading(false)
        }
    }

    const handleFolderClick = (folder) => {
        setCurrentPath(folder.path)
    }

    const handleBack = () => {
        if (currentPath === '/') return
        const parts = currentPath.split('/').filter(Boolean)
        parts.pop()
        setCurrentPath(parts.length === 0 ? '/' : '/' + parts.join('/'))
    }

    const handleGoHome = () => {
        setCurrentPath('/')
    }

    const handleMove = async () => {
        try {
            setMoving(true)
            await onMove(currentPath)
        } catch (err) {
            setError('Move failed')
            setMoving(false)
        }
    }

    // Get breadcrumb parts
    const getBreadcrumbs = () => {
        if (currentPath === '/') return [{ name: 'Root', path: '/' }]
        const parts = currentPath.split('/').filter(Boolean)
        const crumbs = [{ name: 'Root', path: '/' }]
        let accPath = ''
        parts.forEach(part => {
            accPath += '/' + part
            crumbs.push({ name: part, path: accPath })
        })
        return crumbs
    }

    // Check if destination is valid (not the same as current location)
    // Normalize the file's current directory path (handle Windows backslashes)
    const getParentDir = (path) => {
        // Normalize backslashes to forward slashes (Windows compatibility)
        const normalizedPath = path.replace(/\\/g, '/')
        const lastSlash = normalizedPath.lastIndexOf('/')
        if (lastSlash <= 0) return '/' // File is at root
        return normalizedPath.substring(0, lastSlash)
    }

    const fileDirPath = getParentDir(file.path)
    // Normalize both paths for comparison
    const normalizedCurrent = currentPath === '' ? '/' : currentPath
    const canMove = normalizedCurrent !== fileDirPath

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: overlayBg,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 480,
                    maxHeight: '80vh',
                    backgroundColor: bgColor,
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: `1px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            backgroundColor: `hsla(${accentColor.value}, 0.15)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FolderInput style={{ width: 18, height: 18, color: accentHsl }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: textColor }}>
                                Move File
                            </h2>
                            <p style={{ fontSize: 12, color: mutedText, margin: 0 }}>
                                {file.name}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Breadcrumbs */}
                <div style={{
                    padding: '12px 20px',
                    backgroundColor: mutedBg,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={handleGoHome}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: mutedText
                        }}
                    >
                        <Home style={{ width: 14, height: 14 }} />
                    </button>
                    {getBreadcrumbs().slice(1).map((crumb, i) => (
                        <div key={crumb.path} style={{ display: 'flex', alignItems: 'center' }}>
                            <ChevronRight style={{ width: 14, height: 14, color: mutedText }} />
                            <button
                                onClick={() => setCurrentPath(crumb.path)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: textColor
                                }}
                            >
                                {crumb.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Navigation */}
                <div style={{
                    padding: '8px 20px',
                    borderBottom: `1px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentPath === '/'}
                        onClick={handleBack}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    <span style={{ fontSize: 12, color: mutedText }}>
                        Current: <strong style={{ color: textColor }}>{currentPath === '/' ? 'Root' : currentPath}</strong>
                    </span>
                </div>

                {/* Folder List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px 12px',
                    minHeight: 200,
                    maxHeight: 300
                }}>
                    {error && (
                        <div style={{
                            color: 'hsl(0 84.2% 60.2%)',
                            fontSize: 13,
                            backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.1)',
                            padding: '10px 14px',
                            borderRadius: 8,
                            marginBottom: 12
                        }}>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 40
                        }}>
                            <Loader2 style={{ width: 24, height: 24, color: mutedText }} className="animate-spin" />
                        </div>
                    ) : folders.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: 40,
                            color: mutedText
                        }}>
                            <Folder style={{ width: 32, height: 32, marginBottom: 8, opacity: 0.5 }} />
                            <p style={{ fontSize: 13, margin: 0 }}>No subfolders here</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {folders.map(folder => (
                                <button
                                    key={folder.path}
                                    onClick={() => handleFolderClick(folder)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background-color 150ms'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = hoverBg
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                >
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 6,
                                        backgroundColor: 'hsla(45, 93%, 47%, 0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <FolderOpen style={{ width: 16, height: 16, color: 'hsl(45 93% 47%)' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: textColor
                                        }}>
                                            {folder.name}
                                        </div>
                                    </div>
                                    <ChevronRight style={{ width: 16, height: 16, color: mutedText }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 20px',
                    borderTop: `1px solid ${borderColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    backgroundColor: bgColor
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 12, color: mutedText }}>
                            Move to: <strong style={{ color: accentHsl }}>{normalizedCurrent === '/' ? 'Root' : normalizedCurrent}</strong>
                            {!canMove && (
                                <span style={{
                                    marginLeft: 8,
                                    color: 'hsl(45 93% 47%)',
                                    fontStyle: 'italic'
                                }}>
                                    (file is already here)
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Button variant="outline" onClick={onClose} disabled={moving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleMove}
                            disabled={!canMove || moving}
                        >
                            {moving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Moving...
                                </>
                            ) : (
                                <>
                                    <FolderInput className="h-4 w-4 mr-2" />
                                    Move Here
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FolderBrowserModal
