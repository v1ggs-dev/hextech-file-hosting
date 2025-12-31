import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { filesApi, settingsApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTheme } from '@/contexts/ThemeContext'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Upload,
    FolderPlus,
    RefreshCw,
    Search,
    Home,
    ChevronRight,
    ChevronLeft,
    LayoutGrid,
    LayoutList,
    Trash2,
    X,
    FolderOpen,
    CloudUpload,
    Archive,
    Loader2
} from 'lucide-react'
import FileTable from '@/components/FileTable'
import FileGrid from '@/components/FileGrid'
import FileDetails from '@/components/FileDetails'
import UploadPanel from '@/components/UploadPanel'
import DeleteModal from '@/components/DeleteModal'
import BulkDeleteModal from '@/components/BulkDeleteModal'
import FolderBrowserModal from '@/components/FolderBrowserModal'

function FilesPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const { theme, accentColor } = useTheme()
    const isDark = theme === 'dark'
    const currentPath = location.pathname.replace('/files', '') || '/'

    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('name')
    const [sortDir, setSortDir] = useState('asc')
    const [selectedFiles, setSelectedFiles] = useState([])
    const [detailsFile, setDetailsFile] = useState(null)
    const [showUpload, setShowUpload] = useState(false)
    const [showNewFolder, setShowNewFolder] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showBulkDelete, setShowBulkDelete] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const [isZipping, setIsZipping] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [viewMode, setViewMode] = useState('list') // 'list' | 'grid'
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
    const [navHistory, setNavHistory] = useState({ past: [], future: [] })
    const [showRenameDialog, setShowRenameDialog] = useState(false)
    const [showMoveDialog, setShowMoveDialog] = useState(false)
    const [actionFile, setActionFile] = useState(null)
    const [newFileName, setNewFileName] = useState('')
    const [moveDestination, setMoveDestination] = useState('')
    const [publicHostname, setPublicHostname] = useState('')
    const [isDraggingOver, setIsDraggingOver] = useState(false)
    const [pendingFiles, setPendingFiles] = useState([])
    const fileInputRef = useRef(null)
    const dragCounter = useRef(0)

    // Load public hostname for copy URL feature
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await settingsApi.get()
                setPublicHostname(response.data.public_hostname || '')
            } catch (err) {
                console.error('Failed to load settings')
            }
        }
        loadSettings()
    }, [])

    // Theme colors
    const bgColor = isDark ? 'hsl(222.2 84% 4.9%)' : 'white'
    const borderColor = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)'
    const mutedBg = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(210 40% 96.1%)'
    const textColor = isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
    const mutedText = isDark ? 'hsl(215 20.2% 65.1%)' : 'hsl(215.4 16.3% 46.9%)'

    useEffect(() => {
        loadFiles()
        setSelectedFiles([])
        setDetailsFile(null)
        setIsMultiSelectMode(false)
    }, [currentPath])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

            // Ctrl+A - Select all files
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault()
                handleSelectAll()
            }

            if (e.key === 'Escape' && selectedFiles.length > 0) {
                e.preventDefault()
                handleClearSelection()
            }

            if (e.key === 'Delete' && selectedFiles.length > 0) {
                e.preventDefault()
                setShowBulkDelete(true)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedFiles])


    const loadFiles = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await filesApi.list(currentPath)
            setFiles(response.data.files || [])
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load files')
            setFiles([])
            toast.error('Failed to load files')
        } finally {
            setLoading(false)
        }
    }

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(column)
            setSortDir('asc')
        }
    }

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return

        try {
            await filesApi.mkdir(currentPath, newFolderName)
            setShowNewFolder(false)
            setNewFolderName('')
            loadFiles()
            toast.success(`Folder "${newFolderName}" created`)
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create folder')
        }
    }

    // Single click on file - show info only (no multi-select)
    const handleSelectFile = (file) => {
        if (isMultiSelectMode) {
            // In multiselect mode, clicking anywhere toggles selection
            handleToggleSelect(file)
        } else {
            // Normal mode: show file details
            setDetailsFile(file)
            setSelectedFiles([file])
        }
    }

    // Navigate into a folder and track history
    const handleOpenFolder = (file) => {
        setNavHistory(prev => ({
            past: [...prev.past, currentPath],
            future: []
        }))
        navigate(`/files${file.path}`)
    }

    // Checkbox click - toggle selection (with optional ctrl/keep mode)
    const handleToggleSelect = (file, keepExisting = false) => {
        setSelectedFiles(prev => {
            const exists = prev.some(f => f.path === file.path)
            let newSelection

            if (keepExisting) {
                // Ctrl/Cmd click - toggle while keeping others
                if (exists) {
                    newSelection = prev.filter(f => f.path !== file.path)
                } else {
                    newSelection = [...prev, file]
                }
            } else {
                // Normal click - replace selection or toggle if already selected
                if (exists && prev.length === 1) {
                    newSelection = []
                } else {
                    newSelection = [file]
                }
            }

            setIsMultiSelectMode(newSelection.length > 0)
            return newSelection
        })
    }

    // Select all visible files (not folders)
    const handleSelectAll = () => {
        const selectableFiles = sortedFiles.filter(f => !f.is_dir)
        const allSelected = selectableFiles.every(f =>
            selectedFiles.some(sf => sf.path === f.path)
        )

        if (allSelected) {
            // Deselect all
            setSelectedFiles([])
            setIsMultiSelectMode(false)
        } else {
            // Select all
            setSelectedFiles(selectableFiles)
            setIsMultiSelectMode(true)
        }
    }

    // Range select (Shift+click)
    const handleRangeSelect = (startIndex, endIndex) => {
        const start = Math.min(startIndex, endIndex)
        const end = Math.max(startIndex, endIndex)
        const range = sortedFiles.slice(start, end + 1).filter(f => !f.is_dir)

        // Add range to selection (without duplicates)
        setSelectedFiles(prev => {
            const newSelection = [...prev]
            range.forEach(file => {
                if (!newSelection.some(f => f.path === file.path)) {
                    newSelection.push(file)
                }
            })
            setIsMultiSelectMode(newSelection.length > 0)
            return newSelection
        })
    }

    // Clear multiselect mode
    const handleClearSelection = () => {
        setSelectedFiles([])
        setIsMultiSelectMode(false)
    }

    // Navigation: go back
    const handleGoBack = () => {
        if (navHistory.past.length === 0) return
        const previousPath = navHistory.past[navHistory.past.length - 1]
        setNavHistory(prev => ({
            past: prev.past.slice(0, -1),
            future: [currentPath, ...prev.future]
        }))
        navigate(`/files${previousPath === '/' ? '' : previousPath}`)
    }

    // Navigation: go forward
    const handleGoForward = () => {
        if (navHistory.future.length === 0) return
        const nextPath = navHistory.future[0]
        setNavHistory(prev => ({
            past: [...prev.past, currentPath],
            future: prev.future.slice(1)
        }))
        navigate(`/files${nextPath === '/' ? '' : nextPath}`)
    }

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true)
        try {
            for (const file of selectedFiles) {
                await filesApi.delete(file.path, file.name)
            }
            toast.success(`${selectedFiles.length} item${selectedFiles.length !== 1 ? 's' : ''} deleted`)
            handleClearSelection()
            setShowBulkDelete(false)
            setShowDeleteModal(false)
            setDetailsFile(null)
            loadFiles()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Delete failed')
        } finally {
            setIsBulkDeleting(false)
        }
    }

    const handleDownloadZip = async () => {
        if (selectedFiles.length === 0) return

        setIsZipping(true)
        try {
            const paths = selectedFiles.map(f => f.path)
            await filesApi.downloadZip(paths)
            toast.success(`ZIP download started (${selectedFiles.length} item${selectedFiles.length !== 1 ? 's' : ''})`)
            // Keep selection intact - user may want to continue working with these files
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create ZIP')
        } finally {
            setIsZipping(false)
        }
    }

    // Action handlers for file row actions
    const handleCopyUrl = async (file) => {
        if (!publicHostname) {
            toast.error('Public hostname not configured. Set it in Configuration.')
            return
        }
        const url = `https://${publicHostname}${file.path}`
        try {
            await navigator.clipboard.writeText(url)
            toast.success('URL copied to clipboard')
        } catch (err) {
            toast.error('Failed to copy URL')
        }
    }

    const handleDownload = (file) => {
        const downloadUrl = `/api/files/download?path=${encodeURIComponent(file.path)}`
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`Downloading ${file.name}`)
    }

    const handleRenameClick = (file) => {
        setActionFile(file)
        setNewFileName(file.name)
        setShowRenameDialog(true)
    }

    const handleRenameConfirm = async () => {
        if (!actionFile || !newFileName.trim()) return
        try {
            await filesApi.rename(actionFile.path, newFileName)
            toast.success(`Renamed to "${newFileName}"`)
            setShowRenameDialog(false)
            setActionFile(null)
            loadFiles()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Rename failed')
        }
    }

    const handleDeleteClick = (file) => {
        setSelectedFiles([file])
        setShowDeleteModal(true)
    }

    const handleMoveClick = (file) => {
        setActionFile(file)
        setShowMoveDialog(true)
    }

    const handleMoveConfirm = async (destination) => {
        if (!actionFile) return
        try {
            await filesApi.move(actionFile.path, destination)
            toast.success(`Moved to "${destination}"`)
            setShowMoveDialog(false)
            setActionFile(null)
            loadFiles()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Move failed')
            throw err // Re-throw so modal can handle error state
        }
    }

    const handleViewDetails = (file) => {
        setDetailsFile(file)
        // Don't set selectedFiles here - info button should not trigger multi-selection
    }

    // Direct file selection from button click
    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files)
        if (selectedFiles.length > 0) {
            setPendingFiles(selectedFiles)
            setShowUpload(true)
        }
        // Reset input so same file can be selected again
        e.target.value = ''
    }

    // Global drag handlers for workspace overlay
    const handleDragEnter = (e) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter.current++
        if (e.dataTransfer.types.includes('Files')) {
            setIsDraggingOver(true)
        }
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter.current--
        if (dragCounter.current === 0) {
            setIsDraggingOver(false)
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter.current = 0
        setIsDraggingOver(false)

        const droppedFiles = Array.from(e.dataTransfer.files)
        if (droppedFiles.length > 0) {
            setPendingFiles(droppedFiles)
            setShowUpload(true)
        }
    }


    const sortedFiles = useMemo(() => {
        let filtered = [...files]

        if (searchQuery) {
            filtered = filtered.filter(f =>
                f.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        filtered.sort((a, b) => {
            // Folders first
            if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1

            let cmp = 0
            if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
            else if (sortBy === 'size') cmp = (a.size || 0) - (b.size || 0)
            else if (sortBy === 'modified') cmp = new Date(a.modified) - new Date(b.modified)

            return sortDir === 'asc' ? cmp : -cmp
        })

        return filtered
    }, [files, searchQuery, sortBy, sortDir])

    const pathParts = currentPath.split('/').filter(Boolean)
    const currentFolderName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'Root'


    return (
        <div
            className="page-transition"
            style={{ display: 'flex', height: '100%', backgroundColor: bgColor, position: 'relative' }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Hidden file input for direct selection */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {/* Global drag overlay */}
            {isDraggingOver && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: isDark ? 'hsla(222.2, 84%, 4.9%, 0.95)' : 'hsla(0, 0%, 100%, 0.95)',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    border: `3px dashed hsl(${accentColor.value})`,
                    borderRadius: 12,
                    margin: 16,
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: 20,
                        backgroundColor: `hsla(${accentColor.value}, 0.15)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <CloudUpload style={{ width: 40, height: 40, color: `hsl(${accentColor.value})` }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: textColor }}>Drop files to upload</h2>
                        <p style={{ fontSize: 14, color: mutedText, margin: '8px 0 0' }}>Files will be uploaded to {currentPath}</p>
                    </div>
                </div>
            )}

            {/* Main content area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Page Header */}
                <div style={{
                    padding: '24px 24px 0',
                    backgroundColor: bgColor
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: `hsla(${accentColor.value}, 0.15)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FolderOpen style={{ width: 20, height: 20, color: `hsl(${accentColor.value})` }} />
                            </div>
                            <div>
                                <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: textColor }}>Files</h1>
                                <p style={{ fontSize: 13, color: mutedText, margin: 0 }}>Manage your hosted files and folders</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowNewFolder(true)}>
                                <FolderPlus className="h-4 w-4 mr-2" />
                                New Folder
                            </Button>
                            <Button variant="outline" size="sm" onClick={loadFiles}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Path Bar - Improved Breadcrumb Navigation */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 24px',
                    borderBottom: `1px solid ${borderColor}`,
                    backgroundColor: bgColor
                }}>
                    {/* History navigation buttons - separate from breadcrumb */}
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button
                            onClick={handleGoBack}
                            disabled={navHistory.past.length === 0}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                border: `1px solid ${borderColor}`,
                                backgroundColor: navHistory.past.length === 0 ? 'transparent' : mutedBg,
                                cursor: navHistory.past.length === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: navHistory.past.length === 0 ? 0.4 : 1,
                                transition: 'all 150ms'
                            }}
                            title="Go back"
                        >
                            <ChevronLeft style={{ width: 16, height: 16, color: textColor }} />
                        </button>
                        <button
                            onClick={handleGoForward}
                            disabled={navHistory.future.length === 0}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                border: `1px solid ${borderColor}`,
                                backgroundColor: navHistory.future.length === 0 ? 'transparent' : mutedBg,
                                cursor: navHistory.future.length === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: navHistory.future.length === 0 ? 0.4 : 1,
                                transition: 'all 150ms'
                            }}
                            title="Go forward"
                        >
                            <ChevronRight style={{ width: 16, height: 16, color: textColor }} />
                        </button>
                    </div>

                    {/* Breadcrumb path */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0,
                        padding: '6px 12px',
                        borderRadius: 6,
                        backgroundColor: `hsl(${accentColor.value})`,
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 500,
                        overflow: 'hidden'
                    }}>
                        {/* Home icon */}
                        <button
                            onClick={() => navigate('/files')}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px 6px',
                                margin: 0,
                                borderRadius: 4,
                                cursor: currentPath === '/' ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'white',
                                opacity: currentPath === '/' ? 1 : 0.85,
                                fontWeight: currentPath === '/' ? 700 : 500,
                                transition: 'all 150ms'
                            }}
                            onMouseEnter={(e) => { if (currentPath !== '/') e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)' }}
                            onMouseLeave={(e) => { if (currentPath !== '/') e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.backgroundColor = 'transparent' }}
                            disabled={currentPath === '/'}
                        >
                            <Home style={{ width: 14, height: 14 }} />
                        </button>

                        {/* Path segments */}
                        {currentPath !== '/' && currentPath.split('/').filter(Boolean).map((segment, index, arr) => {
                            const isLast = index === arr.length - 1
                            const segmentPath = '/' + arr.slice(0, index + 1).join('/')

                            return (
                                <div key={segmentPath} style={{ display: 'flex', alignItems: 'center' }}>
                                    {/* Chevron separator */}
                                    <ChevronRight style={{
                                        width: 14,
                                        height: 14,
                                        opacity: 0.6,
                                        flexShrink: 0,
                                        margin: '0 2px'
                                    }} />

                                    {/* Segment button */}
                                    {isLast ? (
                                        // Last segment - current location (non-clickable, bold)
                                        <span style={{
                                            padding: '2px 6px',
                                            fontWeight: 700,
                                            cursor: 'default'
                                        }}>
                                            {segment}
                                        </span>
                                    ) : (
                                        // Clickable segment
                                        <button
                                            onClick={() => navigate('/files' + segmentPath)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                padding: '2px 6px',
                                                margin: 0,
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                color: 'white',
                                                fontSize: 13,
                                                fontWeight: 500,
                                                opacity: 0.85,
                                                transition: 'all 150ms'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '1'
                                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.opacity = '0.85'
                                                e.currentTarget.style.backgroundColor = 'transparent'
                                            }}
                                        >
                                            {segment}
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div style={{ flex: 1 }} />

                    {/* Search */}
                    <div style={{ position: 'relative', width: 200 }}>
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>

                    {/* View toggle */}
                    <div style={{ display: 'flex', borderRadius: 6, border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '6px 10px',
                                border: 'none',
                                backgroundColor: viewMode === 'list' ? mutedBg : 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <LayoutList style={{ width: 16, height: 16, color: viewMode === 'list' ? textColor : mutedText }} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                padding: '6px 10px',
                                border: 'none',
                                borderLeft: `1px solid ${borderColor}`,
                                backgroundColor: viewMode === 'grid' ? mutedBg : 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <LayoutGrid style={{ width: 16, height: 16, color: viewMode === 'grid' ? textColor : mutedText }} />
                        </button>
                    </div>
                </div>



                {/* Selection bar - sticky */}
                {selectedFiles.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 24px',
                        backgroundColor: isDark ? 'hsl(217.2 32.6% 10%)' : 'hsl(24 95% 98%)',
                        borderBottom: `1px solid ${borderColor}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>
                            {selectedFiles.length} item{selectedFiles.length !== 1 ? 's' : ''} selected
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadZip}
                            disabled={isZipping || isBulkDeleting}
                        >
                            {isZipping ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Archive className="h-4 w-4 mr-2" />
                            )}
                            {isZipping ? 'Preparing ZIP...' : 'Download ZIP'}
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowBulkDelete(true)}
                            disabled={isZipping || isBulkDeleting}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearSelection}
                            style={{ marginLeft: 'auto' }}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Clear selection
                        </Button>
                    </div>
                )}

                {/* Upload panel */}
                {showUpload && (
                    <UploadPanel
                        currentPath={currentPath}
                        initialFiles={pendingFiles}
                        onUploadComplete={() => {
                            loadFiles()
                            setShowUpload(false)
                            setPendingFiles([])
                            toast.success('Upload complete')
                        }}
                        onClose={() => {
                            setShowUpload(false)
                            setPendingFiles([])
                        }}
                    />
                )}

                {/* Error state */}
                {error && (
                    <div style={{
                        padding: '12px 24px',
                        backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.1)',
                        color: 'hsl(0 84.2% 60.2%)',
                        fontSize: 13
                    }}>
                        {error}
                    </div>
                )}

                {/* File list */}
                <ScrollArea style={{ flex: 1 }}>
                    <div style={{ padding: 24 }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 64, color: mutedText }}>
                                Loading files...
                            </div>
                        ) : viewMode === 'list' ? (
                            <FileTable
                                files={sortedFiles}
                                sortBy={sortBy}
                                sortDir={sortDir}
                                onSort={handleSort}
                                selectedFiles={selectedFiles}
                                onSelectFile={handleSelectFile}
                                onOpenFolder={handleOpenFolder}
                                onToggleSelect={handleToggleSelect}
                                onSelectAll={handleSelectAll}
                                onRangeSelect={handleRangeSelect}
                                isMultiSelectMode={isMultiSelectMode}
                                onCopyUrl={handleCopyUrl}
                                onDownload={handleDownload}
                                onRename={handleRenameClick}
                                onDelete={handleDeleteClick}
                                onMove={handleMoveClick}
                                onViewDetails={handleViewDetails}
                                publicHost={publicHostname}
                            />
                        ) : (
                            <FileGrid
                                files={sortedFiles}
                                selectedFiles={selectedFiles}
                                onSelectFile={handleSelectFile}
                                onOpenFolder={handleOpenFolder}
                                onToggleSelect={handleToggleSelect}
                                isMultiSelectMode={isMultiSelectMode}
                            />
                        )}
                    </div>
                </ScrollArea>

                {/* Status bar */}
                <div style={{
                    padding: '8px 24px',
                    borderTop: `1px solid ${borderColor}`,
                    backgroundColor: mutedBg,
                    fontSize: 12,
                    color: mutedText
                }}>
                    <span>{sortedFiles.length} items</span>
                </div>
            </div>

            {/* Details panel */}
            {
                detailsFile && !detailsFile.is_dir && (
                    <FileDetails
                        file={detailsFile}
                        onClose={() => setDetailsFile(null)}
                        onRefresh={loadFiles}
                    />
                )
            }

            {/* New Folder Dialog */}
            <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription>
                            Enter a name for the new folder in {currentPath}
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="Folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewFolder(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            {
                showDeleteModal && selectedFiles.length > 0 && (
                    <DeleteModal
                        file={selectedFiles.length === 1 ? selectedFiles[0] : { name: `${selectedFiles.length} items`, is_dir: false }}
                        onClose={() => setShowDeleteModal(false)}
                        onDeleted={handleBulkDelete}
                    />
                )
            }

            {/* Rename Dialog */}
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename File</DialogTitle>
                        <DialogDescription>
                            Enter a new name for "{actionFile?.name}"
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="New file name"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRenameConfirm} disabled={!newFileName.trim() || newFileName === actionFile?.name}>
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Move Dialog - Folder Browser */}
            {showMoveDialog && actionFile && (
                <FolderBrowserModal
                    file={actionFile}
                    onClose={() => {
                        setShowMoveDialog(false)
                        setActionFile(null)
                    }}
                    onMove={handleMoveConfirm}
                />
            )}

            {/* Bulk Delete Modal */}
            {showBulkDelete && (
                <BulkDeleteModal
                    itemCount={selectedFiles.length}
                    onClose={() => setShowBulkDelete(false)}
                    onConfirm={handleBulkDelete}
                    isDeleting={isBulkDeleting}
                />
            )}
        </div >
    )
}

export default FilesPage
