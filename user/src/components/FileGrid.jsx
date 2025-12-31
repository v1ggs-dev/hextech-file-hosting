import { useTheme } from '@/contexts/ThemeContext'
import { getFileTypeInfo } from '@/lib/fileTypes'
import { Check } from 'lucide-react'

function FileGrid({ files, selectedFiles, onSelectFile, onOpenFolder, onToggleSelect, isMultiSelectMode }) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    // Theme colors
    const mutedBg = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(210 40% 96.1%)'
    const textColor = isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
    const mutedText = isDark ? 'hsl(215 20.2% 65.1%)' : 'hsl(215.4 16.3% 46.9%)'
    const hoverBg = isDark ? 'hsl(217.2 32.6% 12%)' : 'hsl(210 40% 96.1%)'
    const borderColor = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 85%)'

    const formatSize = (bytes) => {
        if (bytes === 0) return '—'
        const units = ['B', 'KB', 'MB', 'GB']
        let i = 0
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024
            i++
        }
        return `${bytes.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
    }

    const handleClick = (e, file) => {
        if (file.is_dir) {
            onOpenFolder(file)
        } else if (isMultiSelectMode) {
            // In multiselect mode, clicking anywhere toggles selection
            onToggleSelect && onToggleSelect(file)
        } else {
            // Normal mode: show file details
            onSelectFile(file)
        }
    }


    if (files.length === 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '64px 24px',
                    textAlign: 'center'
                }}
            >
                <div
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 16,
                        backgroundColor: mutedBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16
                    }}
                >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={mutedText} strokeWidth="1.5">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: textColor }}>
                    This folder is empty
                </h3>
                <p style={{ fontSize: 14, color: mutedText, maxWidth: 280 }}>
                    Upload files or create a new folder to get started.
                </p>
            </div>
        )
    }

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 16,
                padding: 4
            }}
        >
            {files.map((file) => {
                const typeInfo = getFileTypeInfo(file.name, file.is_dir)
                const Icon = typeInfo.icon
                const isSelected = selectedFiles.some(f => f.path === file.path)

                return (
                    <div
                        key={file.path}
                        onClick={(e) => handleClick(e, file)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: 16,
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 150ms',
                            backgroundColor: isSelected ? 'hsla(24, 95%, 53%, 0.1)' : 'transparent',
                            border: isSelected ? '2px solid hsl(24 95% 53%)' : '2px solid transparent',
                            position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = hoverBg
                        }}
                        onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                    >
                        {/* Checkbox for multiselect */}
                        {!file.is_dir && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    width: 20,
                                    height: 20,
                                    borderRadius: 4,
                                    border: isSelected ? 'none' : `2px solid ${borderColor}`,
                                    backgroundColor: isSelected ? 'hsl(24 95% 53%)' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 2
                                }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleSelect && onToggleSelect(file)
                                }}
                            >
                                {isSelected && <Check style={{ width: 14, height: 14, color: 'white' }} />}
                            </div>
                        )}

                        {/* Icon */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 56,
                                height: 56,
                                borderRadius: 12,
                                backgroundColor: typeInfo.bg,
                                marginBottom: 12
                            }}
                        >
                            <Icon style={{ width: 28, height: 28, color: typeInfo.color }} />
                        </div>

                        {/* Name */}
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 500,
                                textAlign: 'center',
                                wordBreak: 'break-word',
                                lineHeight: 1.3,
                                maxWidth: '100%',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                color: textColor
                            }}
                        >
                            {file.name}
                        </span>

                        {/* Size */}
                        {!file.is_dir && (
                            <span style={{ fontSize: 11, color: mutedText, marginTop: 4 }}>
                                {formatSize(file.size)}
                            </span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export default FileGrid
