import { useState, useEffect } from 'react'
import { filesApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/contexts/ThemeContext'
import {
    X, Copy, Check, Edit2, Trash2, ExternalLink,
    Image as ImageIcon, Download, Clock, Shield,
    Link2, FolderOpen, Info
} from 'lucide-react'
import { getFileTypeInfo, isImageFile } from '@/lib/fileTypes'

function FileDetails({ file, onClose, onRefresh }) {
    const { theme, accentColor } = useTheme()
    const isDark = theme === 'dark'

    const [metadata, setMetadata] = useState(null)
    const [loading, setLoading] = useState(true)
    const [copiedUrl, setCopiedUrl] = useState(false)
    const [copiedHash, setCopiedHash] = useState(false)
    const [showRename, setShowRename] = useState(false)
    const [newName, setNewName] = useState('')
    const [error, setError] = useState(null)
    const [imageError, setImageError] = useState(false)

    // Delete confirmation state
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState(null)

    // Theme colors
    const bgColor = isDark ? 'hsl(222.2 84% 4.9%)' : 'white'
    const borderColor = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)'
    const mutedBg = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(210 40% 96.1%)'
    const textColor = isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
    const mutedText = isDark ? 'hsl(215 20.2% 65.1%)' : 'hsl(215.4 16.3% 46.9%)'
    const overlayBg = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'
    const accentHsl = `hsl(${accentColor.value})`
    const dangerBg = isDark ? 'hsla(0, 84%, 60%, 0.08)' : 'hsla(0, 84%, 60%, 0.05)'
    const dangerBorder = isDark ? 'hsla(0, 84%, 60%, 0.2)' : 'hsla(0, 84%, 60%, 0.15)'

    const typeInfo = getFileTypeInfo(file.name, file.is_dir)
    const Icon = typeInfo.icon
    const canPreview = isImageFile(file.name)
    const canDelete = deleteConfirmText === file.name

    useEffect(() => {
        if (file && !file.is_dir) {
            loadMetadata()
            setImageError(false)
        } else {
            setLoading(false)
            setMetadata(null)
        }
    }, [file])

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showRename) {
                    setShowRename(false)
                } else {
                    onClose()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose, showRename])

    const loadMetadata = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await filesApi.getMetadata(file.path)
            setMetadata(response.data)
        } catch (err) {
            setError('Failed to load metadata')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = async (text, type) => {
        try {
            await navigator.clipboard.writeText(text)
            if (type === 'url') {
                setCopiedUrl(true)
                setTimeout(() => setCopiedUrl(false), 2000)
            } else if (type === 'hash') {
                setCopiedHash(true)
                setTimeout(() => setCopiedHash(false), 2000)
            }
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const handleRename = async () => {
        if (!newName.trim()) return
        try {
            await filesApi.rename(file.path, newName)
            setShowRename(false)
            setNewName('')
            onRefresh()
            onClose()
        } catch (err) {
            setError(err.response?.data?.error || 'Rename failed')
        }
    }

    const handleDelete = async () => {
        if (!canDelete) return

        setDeleting(true)
        setDeleteError(null)

        try {
            await filesApi.delete(file.path, file.name)
            onRefresh()
            onClose()
        } catch (err) {
            setDeleteError(err.response?.data?.error || 'Delete failed')
            setDeleting(false)
        }
    }

    const handleDownload = () => {
        if (metadata?.public_url) {
            const link = document.createElement('a')
            link.href = metadata.public_url
            link.download = file.name
            link.target = '_blank'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const formatSize = (bytes) => {
        const units = ['B', 'KB', 'MB', 'GB']
        let i = 0
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024
            i++
        }
        return `${bytes.toFixed(2)} ${units[i]}`
    }

    const formatRelativeTime = (dateStr) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
        return date.toLocaleDateString()
    }

    // Section Header Component
    const SectionHeader = ({ icon: SectionIcon, title }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: `1px solid ${borderColor}`
        }}>
            <SectionIcon style={{ width: 14, height: 14, color: accentHsl }} />
            <span style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: accentHsl
            }}>
                {title}
            </span>
        </div>
    )

    return (
        <>
            {/* Overlay */}
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
                {/* Modal */}
                <div
                    style={{
                        width: '100%',
                        maxWidth: 600,
                        maxHeight: '90vh',
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
                    {/* Header - File Identity */}
                    <div
                        style={{
                            padding: '20px 24px',
                            borderBottom: `1px solid ${borderColor}`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 16,
                            flexShrink: 0
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0, flex: 1 }}>
                            {/* File Type Badge */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 48,
                                    height: 48,
                                    borderRadius: 10,
                                    backgroundColor: typeInfo.bg,
                                    flexShrink: 0
                                }}
                            >
                                <Icon style={{ width: 24, height: 24, color: typeInfo.color }} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                {/* Filename - Primary Identity */}
                                {showRename ? (
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <Input
                                            placeholder="New name"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRename()
                                                if (e.key === 'Escape') setShowRename(false)
                                            }}
                                            autoFocus
                                            style={{ flex: 1, height: 36 }}
                                        />
                                        <Button size="sm" onClick={handleRename} disabled={!newName.trim()} style={{ height: 36 }}>
                                            Save
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setShowRename(false)} style={{ height: 36 }}>
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <h2 style={{
                                            fontSize: 18,
                                            fontWeight: 600,
                                            margin: 0,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            color: textColor,
                                            maxWidth: '380px'
                                        }}>
                                            {file.name}
                                        </h2>
                                        <button
                                            onClick={() => {
                                                setShowRename(true)
                                                setNewName(file.name)
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                padding: 4,
                                                cursor: 'pointer',
                                                borderRadius: 4,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Edit2 style={{ width: 14, height: 14, color: mutedText }} />
                                        </button>
                                    </div>
                                )}
                                {/* File Type Label */}
                                <p style={{
                                    fontSize: 12,
                                    color: mutedText,
                                    margin: '4px 0 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6
                                }}>
                                    <span style={{
                                        backgroundColor: typeInfo.bg,
                                        color: typeInfo.color,
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}>
                                        {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                                    </span>
                                    {metadata && <span>• {formatSize(metadata.size)}</span>}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden'
                    }}>
                        <div style={{ padding: 24 }}>
                            {error && (
                                <div style={{
                                    color: 'hsl(0 84.2% 60.2%)',
                                    fontSize: 13,
                                    backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.1)',
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    marginBottom: 20
                                }}>
                                    {error}
                                </div>
                            )}

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 48, color: mutedText }}>
                                    Loading...
                                </div>
                            ) : (
                                <>
                                    {/* Image Preview */}
                                    {canPreview && metadata?.public_url && !imageError && (
                                        <div style={{ marginBottom: 24 }}>
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    width: '100%',
                                                    paddingBottom: '56.25%',
                                                    backgroundColor: mutedBg,
                                                    borderRadius: 8,
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <img
                                                    src={metadata.public_url}
                                                    alt={file.name}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain'
                                                    }}
                                                    onError={() => setImageError(true)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Preview Fallback */}
                                    {canPreview && imageError && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 32,
                                                backgroundColor: mutedBg,
                                                borderRadius: 8,
                                                marginBottom: 24
                                            }}
                                        >
                                            <ImageIcon style={{ width: 40, height: 40, color: mutedText, marginBottom: 8 }} />
                                            <p style={{ fontSize: 13, color: mutedText }}>Preview unavailable</p>
                                        </div>
                                    )}

                                    {/* ═══ SECTION: File Overview ═══ */}
                                    <div style={{ marginBottom: 24 }}>
                                        <SectionHeader icon={Info} title="File Overview" />
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 16
                                        }}>
                                            {/* Size */}
                                            {metadata && (
                                                <div>
                                                    <Label style={{ fontSize: 10, color: mutedText, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                        Size
                                                    </Label>
                                                    <p style={{ fontSize: 14, marginTop: 4, fontWeight: 500, color: textColor }}>
                                                        {formatSize(metadata.size)}
                                                    </p>
                                                </div>
                                            )}

                                            {/* MIME Type */}
                                            {metadata && (
                                                <div>
                                                    <Label style={{ fontSize: 10, color: mutedText, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                        MIME Type
                                                    </Label>
                                                    <p style={{ fontSize: 14, marginTop: 4, fontWeight: 500, color: textColor }}>
                                                        {metadata.mime_type}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Modified - with relative time */}
                                            {metadata && (
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <Label style={{ fontSize: 10, color: mutedText, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Clock style={{ width: 10, height: 10 }} />
                                                        Last Modified
                                                    </Label>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                                                        <span style={{ fontSize: 14, fontWeight: 500, color: textColor }}>
                                                            {formatRelativeTime(metadata.modified)}
                                                        </span>
                                                        <span style={{ fontSize: 12, color: mutedText }}>
                                                            ({new Date(metadata.modified).toLocaleString()})
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ═══ SECTION: Access ═══ */}
                                    {metadata && (
                                        <div style={{ marginBottom: 24 }}>
                                            <SectionHeader icon={Link2} title="Access" />

                                            {/* Public URL */}
                                            <div style={{ marginBottom: 12 }}>
                                                <Label style={{ fontSize: 10, color: mutedText, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                    Public URL
                                                </Label>
                                                <code style={{
                                                    display: 'block',
                                                    fontSize: 12,
                                                    backgroundColor: mutedBg,
                                                    padding: '10px 12px',
                                                    borderRadius: 6,
                                                    marginTop: 6,
                                                    color: textColor,
                                                    wordBreak: 'break-all'
                                                }}>
                                                    {metadata.public_url}
                                                </code>
                                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        style={{ flex: 1 }}
                                                        onClick={() => copyToClipboard(metadata.public_url, 'url')}
                                                    >
                                                        {copiedUrl ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
                                                        {copiedUrl ? 'Copied!' : 'Copy URL'}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        style={{ flex: 1 }}
                                                        onClick={() => window.open(metadata.public_url, '_blank')}
                                                    >
                                                        <ExternalLink className="h-3 w-3 mr-2" />
                                                        Open in new tab
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ═══ SECTION: Storage & Integrity ═══ */}
                                    {metadata && (
                                        <div style={{ marginBottom: 24 }}>
                                            <SectionHeader icon={Shield} title="Storage & Integrity" />

                                            {/* Internal Path */}
                                            <div style={{ marginBottom: 16 }}>
                                                <Label style={{ fontSize: 10, color: mutedText, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <FolderOpen style={{ width: 10, height: 10 }} />
                                                    Internal Storage Path
                                                </Label>
                                                <code style={{
                                                    display: 'block',
                                                    fontSize: 12,
                                                    backgroundColor: mutedBg,
                                                    padding: '10px 12px',
                                                    borderRadius: 6,
                                                    marginTop: 6,
                                                    wordBreak: 'break-all',
                                                    color: mutedText
                                                }}>
                                                    {file.path}
                                                </code>
                                            </div>

                                            {/* SHA256 Hash */}
                                            <div>
                                                <Label style={{ fontSize: 10, color: mutedText, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Shield style={{ width: 10, height: 10 }} />
                                                    SHA256 Hash
                                                </Label>
                                                <code style={{
                                                    display: 'block',
                                                    fontSize: 10,
                                                    backgroundColor: mutedBg,
                                                    padding: '10px 12px',
                                                    borderRadius: 6,
                                                    marginTop: 6,
                                                    wordBreak: 'break-all',
                                                    fontFamily: 'monospace',
                                                    color: mutedText
                                                }}>
                                                    {metadata.sha256}
                                                </code>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-2"
                                                    onClick={() => copyToClipboard(metadata.sha256, 'hash')}
                                                >
                                                    {copiedHash ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
                                                    {copiedHash ? 'Copied!' : 'Copy Hash'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ═══ DANGER ZONE ═══ */}
                                    <div style={{
                                        padding: 16,
                                        backgroundColor: dangerBg,
                                        border: `1px solid ${dangerBorder}`,
                                        borderRadius: 8
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 12
                                        }}>
                                            <Trash2 style={{ width: 14, height: 14, color: 'hsl(0 84.2% 60.2%)' }} />
                                            <span style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                color: 'hsl(0 84.2% 60.2%)'
                                            }}>
                                                Danger Zone
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 12, color: mutedText, marginBottom: 12 }}>
                                            This action cannot be undone. The file will be permanently deleted from the CDN.
                                        </p>

                                        {deleteError && (
                                            <div style={{
                                                color: 'hsl(0 84.2% 60.2%)',
                                                fontSize: 12,
                                                backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.15)',
                                                padding: '8px 12px',
                                                borderRadius: 6,
                                                marginBottom: 12
                                            }}>
                                                {deleteError}
                                            </div>
                                        )}

                                        <p style={{ fontSize: 12, color: textColor, marginBottom: 8 }}>
                                            To confirm, type <strong style={{ color: 'hsl(0 84.2% 60.2%)' }}>{file.name}</strong> below:
                                        </p>
                                        <Input
                                            placeholder="Type filename to confirm"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && canDelete) handleDelete()
                                            }}
                                            style={{ marginBottom: 12 }}
                                        />
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="w-full"
                                            onClick={handleDelete}
                                            disabled={!canDelete || deleting}
                                        >
                                            <Trash2 className="h-3 w-3 mr-2" />
                                            {deleting ? 'DELETING...' : 'DELETE'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Fixed Footer - Download only */}
                    {!loading && metadata && (
                        <div style={{
                            padding: '16px 24px',
                            borderTop: `1px solid ${borderColor}`,
                            backgroundColor: bgColor,
                            flexShrink: 0
                        }}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={handleDownload}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default FileDetails
