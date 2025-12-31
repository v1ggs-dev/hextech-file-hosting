import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowUp,
    ArrowDown,
    Check,
    Minus,
    Link2,
    Download,
    Info,
    MoreHorizontal,
    Pencil,
    FolderInput,
    Trash2,
    ExternalLink
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { getFileTypeInfo } from '@/lib/fileTypes'

function FileTable({
    files,
    sortBy,
    sortDir,
    onSort,
    selectedFiles,
    onSelectFile,
    onOpenFolder,
    onToggleSelect,
    onSelectAll,
    onRangeSelect,
    isMultiSelectMode,
    onCopyUrl,
    onDownload,
    onRename,
    onDelete,
    onMove,
    onViewDetails,
    publicHost = 'localhost'
}) {
    const navigate = useNavigate()
    const { theme, accentColor } = useTheme()
    const isDark = theme === 'dark'
    const [hoveredRow, setHoveredRow] = useState(null)
    const [hoveredName, setHoveredName] = useState(null)
    const lastSelectedIndex = useRef(null)

    // Context menu state
    const [contextMenu, setContextMenu] = useState(null) // { x, y, file }

    // Theme colors
    const mutedBg = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(210 40% 96.1%)'
    const textColor = isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
    const mutedText = isDark ? 'hsl(215 20.2% 65.1%)' : 'hsl(215.4 16.3% 46.9%)'
    const borderColor = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 85%)'
    const actionBg = isDark ? 'hsl(217.2 32.6% 12%)' : 'hsl(210 40% 98%)'
    const hoverColor = `hsl(${accentColor.value})`
    const selectedBg = isDark ? 'hsla(24, 95%, 53%, 0.08)' : 'hsla(24, 95%, 53%, 0.06)'
    const menuBg = isDark ? 'hsl(222.2 84% 6%)' : 'white'
    const menuBorder = isDark ? 'hsl(217.2 32.6% 20%)' : 'hsl(214.3 31.8% 91.4%)'
    // Slightly more muted color for metadata columns
    const metadataText = isDark ? 'hsl(215 20.2% 55%)' : 'hsl(215.4 16.3% 56%)'
    const menuHoverBg = isDark ? 'hsl(217.2 32.6% 15%)' : 'hsl(210 40% 96.1%)'

    // Get only file items (not directories) for selection
    const selectableFiles = files.filter(f => !f.is_dir)
    const selectedCount = selectedFiles.length
    const allSelected = selectableFiles.length > 0 && selectedCount === selectableFiles.length
    const someSelected = selectedCount > 0 && selectedCount < selectableFiles.length

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null)
        const handleScroll = () => setContextMenu(null)

        if (contextMenu) {
            document.addEventListener('click', handleClick)
            document.addEventListener('scroll', handleScroll, true)
            return () => {
                document.removeEventListener('click', handleClick)
                document.removeEventListener('scroll', handleScroll, true)
            }
        }
    }, [contextMenu])

    // Handle checkbox click - always toggles (add/remove from selection)
    const handleCheckboxClick = (e, file, index) => {
        e.stopPropagation()

        if (e.shiftKey && lastSelectedIndex.current !== null && onRangeSelect) {
            // Range select
            onRangeSelect(lastSelectedIndex.current, index)
        } else {
            // Always toggle while keeping other selections (multiselect friendly)
            onToggleSelect && onToggleSelect(file, true)
        }
        lastSelectedIndex.current = index
    }

    // Handle row click (outside checkbox and name) - only handles folder navigation
    const handleRowClick = (e, file, index) => {
        if (file.is_dir) {
            onOpenFolder(file)
        }
        // Files are no longer selected by row click - use checkbox instead
    }

    // Handle right-click context menu
    const handleContextMenu = (e, file) => {
        if (file.is_dir) return // No context menu for folders

        e.preventDefault()
        e.stopPropagation()

        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            file: file
        })
    }

    // Handle name/icon click - opens file in new tab
    const handleNameClick = (e, file, publicHost) => {
        e.stopPropagation()
        if (file.is_dir) {
            onOpenFolder(file)
        } else {
            // Open file in new tab using public CDN URL
            const publicPath = file.path.startsWith('/') ? file.path.slice(1) : file.path
            const publicUrl = `https://${publicHost}/${publicPath}`
            window.open(publicUrl, '_blank')
        }
    }

    // Header checkbox click
    const handleSelectAll = () => {
        onSelectAll && onSelectAll()
    }

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

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return null
        return sortDir === 'asc'
            ? <ArrowUp className="h-3 w-3 ml-1" />
            : <ArrowDown className="h-3 w-3 ml-1" />
    }

    const ActionButton = ({ icon: Icon, label, onClick }) => (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onClick()
                        }}
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 6,
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 150ms'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = actionBg
                            e.currentTarget.querySelector('svg').style.color = hoverColor
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.querySelector('svg').style.color = mutedText
                        }}
                    >
                        <Icon style={{ width: 18, height: 18, color: mutedText, transition: 'color 150ms' }} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                    <p style={{ fontSize: 12 }}>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )

    // Context Menu Item Component
    const ContextMenuItem = ({ icon: Icon, label, onClick, destructive = false }) => (
        <div
            onClick={(e) => {
                e.stopPropagation()
                setContextMenu(null)
                onClick()
            }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 13,
                color: destructive ? 'hsl(0 84.2% 60.2%)' : textColor,
                transition: 'background-color 150ms'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = destructive
                    ? 'hsla(0, 84.2%, 60.2%, 0.1)'
                    : menuHoverBg
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
            }}
        >
            <Icon style={{ width: 16, height: 16 }} />
            {label}
        </div>
    )

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
        <div className="border rounded-lg overflow-hidden" style={{ position: 'relative' }}>
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead style={{ width: 40 }}>
                            {/* Header checkbox */}
                            <div
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 4,
                                    border: allSelected || someSelected ? 'none' : `2px solid ${borderColor}`,
                                    backgroundColor: allSelected || someSelected ? 'hsl(24 95% 53%)' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                                onClick={handleSelectAll}
                            >
                                {allSelected && <Check style={{ width: 14, height: 14, color: 'white' }} />}
                                {someSelected && <Minus style={{ width: 14, height: 14, color: 'white' }} />}
                            </div>
                        </TableHead>
                        <TableHead
                            className="cursor-pointer select-none"
                            onClick={() => onSort('name')}
                        >
                            <div className="flex items-center">
                                Name
                                <SortIcon column="name" />
                            </div>
                        </TableHead>
                        <TableHead
                            className="w-28 cursor-pointer select-none text-right"
                            onClick={() => onSort('size')}
                        >
                            <div className="flex items-center justify-end">
                                Size
                                <SortIcon column="size" />
                            </div>
                        </TableHead>
                        <TableHead
                            className="w-48 cursor-pointer select-none"
                            onClick={() => onSort('modified')}
                        >
                            <div className="flex items-center">
                                Modified
                                <SortIcon column="modified" />
                            </div>
                        </TableHead>
                        <TableHead style={{ width: 180 }}>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {files.map((file, index) => {
                        const typeInfo = getFileTypeInfo(file.name, file.is_dir)
                        const Icon = typeInfo.icon
                        const isSelected = selectedFiles.some(f => f.path === file.path)
                        const isHovered = hoveredRow === file.path
                        const showActions = !file.is_dir && isHovered && !isSelected

                        return (
                            <TableRow
                                key={file.path}
                                onClick={(e) => handleRowClick(e, file, index)}
                                onContextMenu={(e) => handleContextMenu(e, file)}
                                onMouseEnter={() => setHoveredRow(file.path)}
                                onMouseLeave={() => setHoveredRow(null)}
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? selectedBg : undefined
                                }}
                                className={isSelected ? "" : "hover:bg-muted/50"}
                            >
                                <TableCell style={{ padding: '8px 12px' }}>
                                    {/* Row checkbox */}
                                    <div
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 4,
                                            border: isSelected ? 'none' : `2px solid ${borderColor}`,
                                            backgroundColor: isSelected ? 'hsl(24 95% 53%)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                        onClick={(e) => handleCheckboxClick(e, file, index)}
                                    >
                                        {isSelected && <Check style={{ width: 14, height: 14, color: 'white' }} />}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {/* Name - clicking opens file in new tab */}
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                                        onClick={(e) => handleNameClick(e, file, publicHost)}
                                        onMouseEnter={() => setHoveredName(file.path)}
                                        onMouseLeave={() => setHoveredName(null)}
                                    >
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
                                            <Icon style={{ width: 16, height: 16, color: typeInfo.color }} />
                                        </div>
                                        <span style={{
                                            fontWeight: 600,
                                            color: hoveredName === file.path && !file.is_dir ? hoverColor : textColor,
                                            textDecoration: hoveredName === file.path && !file.is_dir ? 'underline' : 'none',
                                            cursor: 'pointer',
                                            transition: 'all 150ms',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}>
                                            {file.name}
                                            {hoveredName === file.path && !file.is_dir && (
                                                <ExternalLink style={{
                                                    width: 12,
                                                    height: 12,
                                                    opacity: 0.7,
                                                    flexShrink: 0
                                                }} />
                                            )}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell style={{ textAlign: 'right', color: metadataText, fontSize: 13 }}>
                                    {file.is_dir ? <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Folder</span> : formatSize(file.size)}
                                </TableCell>
                                <TableCell style={{ color: metadataText, fontSize: 13, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                    {formatDate(file.modified)}
                                </TableCell>
                                <TableCell style={{ height: 48, padding: '0 12px' }}>
                                    {/* Only show action buttons for files (not directories) when hovered and not selected */}
                                    {!file.is_dir && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                opacity: showActions ? 1 : 0,
                                                visibility: showActions ? 'visible' : 'hidden',
                                                transition: 'opacity 150ms'
                                            }}
                                        >
                                            <ActionButton
                                                icon={Link2}
                                                label="Copy URL"
                                                onClick={() => onCopyUrl && onCopyUrl(file)}
                                            />
                                            <ActionButton
                                                icon={Download}
                                                label="Download"
                                                onClick={() => onDownload && onDownload(file)}
                                            />
                                            <ActionButton
                                                icon={Info}
                                                label="Info"
                                                onClick={() => onViewDetails && onViewDetails(file)}
                                            />

                                            {/* More actions dropdown */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            width: 34,
                                                            height: 34,
                                                            borderRadius: 6,
                                                            border: 'none',
                                                            backgroundColor: 'transparent',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 150ms'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = actionBg
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent'
                                                        }}
                                                    >
                                                        <MoreHorizontal style={{ width: 18, height: 18, color: mutedText }} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" sideOffset={4}>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onRename && onRename(file)
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onMove && onMove(file)
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <FolderInput className="mr-2 h-4 w-4" />
                                                        Move
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onDelete && onDelete(file)
                                                        }}
                                                        className="cursor-pointer text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {/* Right-click Context Menu */}
            {contextMenu && (
                <div
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        backgroundColor: menuBg,
                        border: `1px solid ${menuBorder}`,
                        borderRadius: 8,
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                        zIndex: 1000,
                        minWidth: 180,
                        padding: '6px 0',
                        overflow: 'hidden'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <ContextMenuItem
                        icon={Link2}
                        label="Copy URL"
                        onClick={() => onCopyUrl && onCopyUrl(contextMenu.file)}
                    />
                    <ContextMenuItem
                        icon={Download}
                        label="Download"
                        onClick={() => onDownload && onDownload(contextMenu.file)}
                    />
                    <ContextMenuItem
                        icon={Info}
                        label="View Info"
                        onClick={() => onViewDetails && onViewDetails(contextMenu.file)}
                    />
                    <div style={{
                        height: 1,
                        backgroundColor: menuBorder,
                        margin: '6px 0'
                    }} />
                    <ContextMenuItem
                        icon={Pencil}
                        label="Rename"
                        onClick={() => onRename && onRename(contextMenu.file)}
                    />
                    <ContextMenuItem
                        icon={FolderInput}
                        label="Move"
                        onClick={() => onMove && onMove(contextMenu.file)}
                    />
                    <div style={{
                        height: 1,
                        backgroundColor: menuBorder,
                        margin: '6px 0'
                    }} />
                    <ContextMenuItem
                        icon={Trash2}
                        label="Delete"
                        onClick={() => onDelete && onDelete(contextMenu.file)}
                        destructive
                    />
                </div>
            )}
        </div>
    )
}

export default FileTable
