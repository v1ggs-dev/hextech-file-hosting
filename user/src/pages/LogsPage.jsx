import { useState, useEffect } from 'react'
import { logsApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/contexts/ThemeContext'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    History,
    Upload,
    Trash2,
    Edit,
    Move,
    Filter,
    X,
    Search,
    Activity
} from 'lucide-react'

function LogsPage() {
    const { theme, accentColor } = useTheme()
    const isDark = theme === 'dark'

    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [offset, setOffset] = useState(0)
    const [showFilters, setShowFilters] = useState(false)
    const [filterActions, setFilterActions] = useState([])
    const [filterPath, setFilterPath] = useState('')
    const limit = 50

    // Theme colors
    const bgColor = isDark ? 'hsl(222.2 84% 4.9%)' : 'white'
    const borderColor = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)'
    const mutedBg = isDark ? 'hsl(217.2 32.6% 12%)' : 'hsl(210 40% 98%)'
    const cardBg = isDark ? 'hsl(217.2 32.6% 8%)' : 'white'
    const textColor = isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
    const mutedText = isDark ? 'hsl(215 20.2% 65.1%)' : 'hsl(215.4 16.3% 46.9%)'

    useEffect(() => {
        loadLogs()
    }, [offset])

    const loadLogs = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await logsApi.list(limit, offset)
            setLogs(response.data.logs || [])
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load logs')
            setLogs([])
        } finally {
            setLoading(false)
        }
    }

    // Normalize path slashes (always use forward slashes)
    const normalizePath = (path) => {
        if (!path) return path
        return path.replace(/\\/g, '/')
    }

    // Format timestamp with full date, time, and seconds (for tooltip)
    const formatTimestamp = (dateStr) => {
        const date = new Date(dateStr)
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }
        return date.toLocaleString(undefined, options)
    }

    // Format relative time ("2 min ago", "1 hour ago", etc.)
    const formatRelativeTime = (dateStr) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now - date
        const diffSec = Math.floor(diffMs / 1000)
        const diffMin = Math.floor(diffSec / 60)
        const diffHour = Math.floor(diffMin / 60)
        const diffDay = Math.floor(diffHour / 24)

        if (diffSec < 60) return 'Just now'
        if (diffMin < 60) return `${diffMin} min${diffMin !== 1 ? 's' : ''} ago`
        if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`
        if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
        return formatTimestamp(dateStr)
    }

    // Parse file path for move/rename operations (contains " -> ")
    const parseFilePath = (log) => {
        const rawPath = log.file_path
        const normalizedPath = normalizePath(rawPath)

        // Check if this is a move/rename operation with old -> new format
        if ((log.action === 'move' || log.action === 'rename') && normalizedPath.includes(' -> ')) {
            const parts = normalizedPath.split(' -> ')
            return {
                isTransition: true,
                oldPath: parts[0],
                newPath: parts[1],
                oldFilename: parts[0].split('/').pop(),
                newFilename: parts[1].split('/').pop(),
                oldFolder: parts[0].substring(0, parts[0].lastIndexOf('/')) || '/',
                newFolder: parts[1].substring(0, parts[1].lastIndexOf('/')) || '/'
            }
        }

        // Standard single path
        return {
            isTransition: false,
            path: normalizedPath,
            filename: normalizedPath.split('/').pop(),
            folder: normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) || '/'
        }
    }

    const actionTypes = [
        { value: 'upload', label: 'Upload', icon: Upload, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' },
        { value: 'delete', label: 'Delete', icon: Trash2, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
        { value: 'rename', label: 'Rename', icon: Edit, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
        { value: 'move', label: 'Move', icon: Move, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
    ]

    const getActionInfo = (action) => {
        return actionTypes.find(a => a.value === action) || {
            value: action,
            label: action,
            icon: History,
            color: '#6B7280',
            bg: 'rgba(107, 114, 128, 0.15)'
        }
    }

    const toggleActionFilter = (action) => {
        setFilterActions(prev => {
            if (prev.includes(action)) {
                return prev.filter(a => a !== action)
            } else {
                return [...prev, action]
            }
        })
    }

    const filteredLogs = logs.filter(log => {
        if (filterActions.length > 0 && !filterActions.includes(log.action)) return false
        // Normalize path for filtering
        const normalizedPath = normalizePath(log.file_path)
        if (filterPath && !normalizedPath.toLowerCase().includes(filterPath.toLowerCase())) return false
        return true
    })

    const clearFilters = () => {
        setFilterActions([])
        setFilterPath('')
    }

    const hasFilters = filterActions.length > 0 || filterPath
    const filterCount = filterActions.length + (filterPath ? 1 : 0)

    // Stats
    const actionCounts = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1
        return acc
    }, {})

    return (
        <div className="page-transition" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: bgColor }}>
            {/* Header */}
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
                            <Activity style={{ width: 20, height: 20, color: `hsl(${accentColor.value})` }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: textColor }}>Activity Log</h1>
                            <p style={{ fontSize: 13, color: mutedText, margin: 0 }}>Monitor all file operations</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {showFilters && hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-1" />
                                Clear all
                            </Button>
                        )}
                        <Button
                            variant={showFilters ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {filterCount > 0 && (
                                <span style={{
                                    marginLeft: 6,
                                    minWidth: 18,
                                    height: 18,
                                    padding: '0 5px',
                                    borderRadius: 9,
                                    backgroundColor: showFilters ? 'white' : `hsl(${accentColor.value})`,
                                    color: showFilters ? `hsl(${accentColor.value})` : 'white',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {filterCount}
                                </span>
                            )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadLogs}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats Cards - Clickable to filter */}
                {!loading && logs.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                        gap: 10,
                        marginBottom: 20
                    }}>
                        {actionTypes.map(action => {
                            const count = actionCounts[action.value] || 0
                            const Icon = action.icon
                            const isActive = filterActions.includes(action.value)
                            return (
                                <Card
                                    key={action.value}
                                    style={{
                                        backgroundColor: isActive ? action.bg : cardBg,
                                        border: isActive ? `2px solid ${action.color}` : `1px solid ${borderColor}`,
                                        cursor: 'pointer',
                                        transition: 'all 150ms'
                                    }}
                                    onClick={() => toggleActionFilter(action.value)}
                                >
                                    <CardContent style={{ padding: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 6,
                                                backgroundColor: isActive ? `${action.color}22` : action.bg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <Icon style={{ width: 14, height: 14, color: action.color }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 16, fontWeight: 700, color: isActive ? action.color : textColor, lineHeight: 1 }}>{count}</div>
                                                <div style={{ fontSize: 10, color: isActive ? action.color : mutedText, textTransform: 'capitalize' }}>{action.label}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Filters panel */}
            {showFilters && (
                <div style={{
                    padding: '16px 24px',
                    borderTop: `1px solid ${borderColor}`,
                    borderBottom: `1px solid ${borderColor}`,
                    backgroundColor: mutedBg
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
                        {/* Action filter */}
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: 'block', marginBottom: 8 }}>
                                ACTION TYPES
                            </label>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {actionTypes.map(action => {
                                    const isActive = filterActions.includes(action.value)

                                    return (
                                        <button
                                            key={action.value}
                                            onClick={() => toggleActionFilter(action.value)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 6,
                                                border: isActive ? `2px solid ${action.color}` : `1px solid ${borderColor}`,
                                                backgroundColor: isActive ? action.bg : bgColor,
                                                color: isActive ? action.color : mutedText,
                                                fontSize: 12,
                                                fontWeight: 500,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {action.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Path filter */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: 'block', marginBottom: 8 }}>
                                FILE PATH
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: mutedText }} />
                                <Input
                                    placeholder="Search by path..."
                                    value={filterPath}
                                    onChange={(e) => setFilterPath(e.target.value)}
                                    style={{ paddingLeft: 36, height: 36 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active filters summary (when filter panel is closed) */}
            {hasFilters && !showFilters && (
                <div style={{
                    padding: '8px 24px',
                    backgroundColor: `hsla(${accentColor.value}, 0.05)`,
                    borderBottom: `1px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap'
                }}>
                    <span style={{ fontSize: 12, color: mutedText }}>Active filters:</span>
                    {filterActions.map(action => {
                        const info = getActionInfo(action)
                        return (
                            <Badge
                                key={action}
                                style={{
                                    backgroundColor: info.bg,
                                    color: info.color,
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    cursor: 'pointer'
                                }}
                                onClick={() => toggleActionFilter(action)}
                            >
                                {info.label}
                                <X style={{ width: 12, height: 12 }} />
                            </Badge>
                        )
                    })}
                    {filterPath && (
                        <Badge
                            variant="secondary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer'
                            }}
                            onClick={() => setFilterPath('')}
                        >
                            Path: {filterPath}
                            <X style={{ width: 12, height: 12 }} />
                        </Badge>
                    )}
                </div>
            )}

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

            <ScrollArea style={{ flex: 1 }}>
                <div style={{ padding: 24 }}>
                    {loading ? (
                        /* Loading skeletons */
                        <div className="border rounded-lg overflow-hidden" style={{ borderColor }}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead style={{ width: 100 }}>Action</TableHead>
                                        <TableHead>File</TableHead>
                                        <TableHead style={{ width: 140 }}>Time</TableHead>
                                        <TableHead style={{ width: 120 }}>Source</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(8)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-48" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : filteredLogs.length === 0 ? (
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
                                <History style={{ width: 40, height: 40, color: mutedText }} />
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: textColor }}>
                                {hasFilters ? 'No matching activity' : 'No activity yet'}
                            </h3>
                            <p style={{ fontSize: 14, color: mutedText, maxWidth: 280 }}>
                                {hasFilters
                                    ? 'Try adjusting your filters to see more results.'
                                    : 'When you upload, delete, or modify files, the activity will appear here.'
                                }
                            </p>
                            {hasFilters && (
                                <Button variant="outline" size="sm" onClick={clearFilters} style={{ marginTop: 16 }}>
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden" style={{ borderColor }}>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead style={{ width: 100 }}>Action</TableHead>
                                        <TableHead>File</TableHead>
                                        <TableHead style={{ width: 140 }}>Time</TableHead>
                                        <TableHead style={{ width: 120 }}>Source</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.map((log) => {
                                        const actionInfo = getActionInfo(log.action)
                                        const pathInfo = parseFilePath(log)

                                        return (
                                            <TableRow key={log.id}>
                                                <TableCell style={{ padding: '12px 16px' }}>
                                                    <Badge
                                                        style={{
                                                            backgroundColor: actionInfo.bg,
                                                            color: actionInfo.color,
                                                            border: 'none',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {actionInfo.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {pathInfo.isTransition ? (
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                                <span style={{ fontWeight: 500, color: textColor }}>{pathInfo.oldFilename}</span>
                                                                <span style={{ color: `hsl(${accentColor.value})`, fontSize: 12 }}>→</span>
                                                                <span style={{ fontWeight: 500, color: textColor }}>{pathInfo.newFilename}</span>
                                                            </div>
                                                            <div style={{ fontSize: 12, color: mutedText, fontFamily: 'monospace' }}>
                                                                {pathInfo.oldFolder === pathInfo.newFolder
                                                                    ? pathInfo.newFolder
                                                                    : `${pathInfo.oldFolder} → ${pathInfo.newFolder}`}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div style={{ fontWeight: 500, color: textColor, marginBottom: 2 }}>{pathInfo.filename}</div>
                                                            <div style={{ fontSize: 12, color: mutedText, fontFamily: 'monospace' }}>{pathInfo.folder}</div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <TooltipProvider delayDuration={200}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div style={{ fontSize: 12, color: textColor, whiteSpace: 'nowrap', cursor: 'default' }}>
                                                                    {formatRelativeTime(log.timestamp)}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                <p style={{ fontSize: 12 }}>{formatTimestamp(log.timestamp)}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell>
                                                    <TooltipProvider delayDuration={200}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="text-muted-foreground text-sm" style={{ cursor: 'default' }}>
                                                                    {log.source_ip || '—'}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                <p style={{ fontSize: 12 }}>Client IP address</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Pagination */}
            {filteredLogs.length > 0 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 24px',
                    borderTop: `1px solid ${borderColor}`,
                    backgroundColor: mutedBg
                }}>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        disabled={offset === 0}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>
                    <span style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: textColor,
                        padding: '4px 12px',
                        borderRadius: 6,
                        backgroundColor: isDark ? 'hsla(217.2, 32.6%, 17.5%, 0.5)' : 'hsla(214.3, 31.8%, 91.4%, 0.5)'
                    }}>
                        {filteredLogs.length} of {logs.length} entries
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOffset(offset + limit)}
                        disabled={logs.length < limit}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    )
}

export default LogsPage
