import { useState, useRef, useEffect } from 'react'
import { filesApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/contexts/ThemeContext'
import { Upload, X, FileUp, Check, AlertCircle } from 'lucide-react'
import { getFileTypeInfo } from '@/lib/fileTypes'

function UploadPanel({ currentPath, initialFiles = [], onUploadComplete, onClose }) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    const [files, setFiles] = useState(initialFiles)
    const [overwrite, setOverwrite] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState({})
    const [fileStatus, setFileStatus] = useState({}) // 'pending' | 'uploading' | 'done' | 'error'
    const [errors, setErrors] = useState({})
    const [dragover, setDragover] = useState(false)
    const fileInputRef = useRef(null)

    // Initialize with passed files if provided
    useEffect(() => {
        if (initialFiles.length > 0) {
            setFiles(initialFiles)
        }
    }, [initialFiles])

    // Theme colors
    const bgColor = isDark ? 'hsl(222.2 84% 4.9%)' : 'white'
    const panelBg = isDark ? 'hsl(217.2 32.6% 12%)' : 'hsl(210 40% 98%)'
    const borderColor = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)'
    const mutedBg = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(210 40% 96.1%)'
    const textColor = isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
    const mutedText = isDark ? 'hsl(215 20.2% 65.1%)' : 'hsl(215.4 16.3% 46.9%)'

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files)
        setFiles(selectedFiles)
        setProgress({})
        setFileStatus({})
        setErrors({})
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragover(false)
        const droppedFiles = Array.from(e.dataTransfer.files)
        setFiles(droppedFiles)
        setProgress({})
        setFileStatus({})
        setErrors({})
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setDragover(true)
    }

    const handleDragLeave = () => {
        setDragover(false)
    }

    const handleUpload = async () => {
        if (files.length === 0) return

        setUploading(true)
        const newProgress = {}
        const newStatus = {}
        const newErrors = {}

        // Initialize all files as pending
        files.forEach(file => {
            newProgress[file.name] = 0
            newStatus[file.name] = 'pending'
        })
        setProgress({ ...newProgress })
        setFileStatus({ ...newStatus })

        let hasErrors = false

        for (const file of files) {
            try {
                newStatus[file.name] = 'uploading'
                setFileStatus({ ...newStatus })

                await filesApi.upload(file, currentPath, overwrite, (percent) => {
                    newProgress[file.name] = percent
                    setProgress({ ...newProgress })
                })

                newProgress[file.name] = 100
                newStatus[file.name] = 'done'
                setProgress({ ...newProgress })
                setFileStatus({ ...newStatus })
            } catch (err) {
                hasErrors = true
                newStatus[file.name] = 'error'
                newErrors[file.name] = err.response?.data?.error || 'Upload failed'
                setFileStatus({ ...newStatus })
                setErrors({ ...newErrors })
            }
        }

        setUploading(false)

        if (!hasErrors) {
            setTimeout(() => {
                setFiles([])
                onUploadComplete()
            }, 500)
        }
    }

    const removeFile = (fileToRemove) => {
        setFiles(files.filter(f => f.name !== fileToRemove.name))
        const newProgress = { ...progress }
        const newStatus = { ...fileStatus }
        const newErrors = { ...errors }
        delete newProgress[fileToRemove.name]
        delete newStatus[fileToRemove.name]
        delete newErrors[fileToRemove.name]
        setProgress(newProgress)
        setFileStatus(newStatus)
        setErrors(newErrors)
    }

    const formatSize = (bytes) => {
        const units = ['B', 'KB', 'MB', 'GB']
        let i = 0
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024
            i++
        }
        return `${bytes.toFixed(1)} ${units[i]}`
    }

    return (
        <div style={{ borderBottom: `1px solid ${borderColor}`, backgroundColor: panelBg, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: textColor }}>Upload to {currentPath}</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Dropzone */}
            <div
                style={{
                    border: `2px dashed ${dragover ? 'hsl(24 95% 53%)' : borderColor}`,
                    borderRadius: 8,
                    padding: files.length > 0 ? 0 : 32,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                    backgroundColor: dragover ? 'hsla(24, 95%, 53%, 0.05)' : bgColor,
                    overflow: 'hidden'
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => files.length === 0 && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {files.length === 0 ? (
                    <>
                        <FileUp style={{ width: 32, height: 32, color: mutedText, margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 14, color: mutedText, margin: 0 }}>
                            Drop files here or click to select
                        </p>
                    </>
                ) : (
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {files.map((file) => {
                            const typeInfo = getFileTypeInfo(file.name)
                            const Icon = typeInfo.icon
                            const status = fileStatus[file.name] || 'pending'
                            const fileProgress = progress[file.name] || 0
                            const fileError = errors[file.name]

                            return (
                                <div
                                    key={file.name}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '10px 12px',
                                        borderBottom: `1px solid ${borderColor}`
                                    }}
                                >
                                    {/* File Icon */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 32,
                                            height: 32,
                                            borderRadius: 6,
                                            backgroundColor: typeInfo.bg,
                                            flexShrink: 0
                                        }}
                                    >
                                        <Icon style={{ width: 14, height: 14, color: typeInfo.color }} />
                                    </div>

                                    {/* File Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textColor }}>
                                                {file.name}
                                            </span>
                                            <span style={{ fontSize: 11, color: mutedText, flexShrink: 0, marginLeft: 8 }}>
                                                {formatSize(file.size)}
                                            </span>
                                        </div>

                                        {/* Progress bar */}
                                        {(status === 'uploading' || status === 'done') && (
                                            <Progress value={fileProgress} className="h-1.5" />
                                        )}

                                        {/* Error message */}
                                        {status === 'error' && (
                                            <p style={{ fontSize: 11, color: 'hsl(0 84.2% 60.2%)', margin: '4px 0 0' }}>
                                                {fileError}
                                            </p>
                                        )}
                                    </div>

                                    {/* Status Icon / Remove Button */}
                                    {status === 'done' ? (
                                        <div style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: '50%',
                                            backgroundColor: 'hsl(142.1 76.2% 36.3%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Check style={{ width: 14, height: 14, color: 'white' }} />
                                        </div>
                                    ) : status === 'error' ? (
                                        <div style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: '50%',
                                            backgroundColor: 'hsl(0 84.2% 60.2%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <AlertCircle style={{ width: 14, height: 14, color: 'white' }} />
                                        </div>
                                    ) : !uploading ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeFile(file)
                                            }}
                                            style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                border: 'none',
                                                backgroundColor: mutedBg,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <X style={{ width: 14, height: 14, color: mutedText }} />
                                        </button>
                                    ) : null}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Options */}
            {files.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <input
                        type="checkbox"
                        id="overwrite"
                        checked={overwrite}
                        onChange={(e) => setOverwrite(e.target.checked)}
                        style={{ borderRadius: 4 }}
                    />
                    <Label htmlFor="overwrite" style={{ fontSize: 13, color: mutedText, cursor: 'pointer' }}>
                        Overwrite existing files
                    </Label>
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <Button
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? `Uploading...` : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
                </Button>
                <Button variant="outline" onClick={onClose} disabled={uploading}>
                    Cancel
                </Button>
                {files.length > 0 && !uploading && (
                    <Button
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ marginLeft: 'auto' }}
                    >
                        Add more
                    </Button>
                )}
            </div>
        </div>
    )
}

export default UploadPanel
