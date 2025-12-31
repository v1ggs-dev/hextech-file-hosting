import {
    File,
    FileText,
    FileImage,
    FileVideo,
    FileAudio,
    FileCode,
    FileArchive,
    FileSpreadsheet,
    FileType,
    Folder,
    FileJson,
    FolderOpen
} from 'lucide-react'

// Map of file extensions to icon components and colors
const fileTypeMap = {
    // Images
    jpg: { icon: FileImage, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    jpeg: { icon: FileImage, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    png: { icon: FileImage, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    gif: { icon: FileImage, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    webp: { icon: FileImage, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    svg: { icon: FileImage, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    ico: { icon: FileImage, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    bmp: { icon: FileImage, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },

    // Videos
    mp4: { icon: FileVideo, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    webm: { icon: FileVideo, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    mov: { icon: FileVideo, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    avi: { icon: FileVideo, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    mkv: { icon: FileVideo, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    flv: { icon: FileVideo, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },

    // Audio
    mp3: { icon: FileAudio, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    wav: { icon: FileAudio, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    ogg: { icon: FileAudio, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    flac: { icon: FileAudio, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    aac: { icon: FileAudio, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },

    // Documents
    pdf: { icon: FileText, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
    doc: { icon: FileText, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    docx: { icon: FileText, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    txt: { icon: FileText, color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
    rtf: { icon: FileText, color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
    md: { icon: FileText, color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },

    // Spreadsheets
    xls: { icon: FileSpreadsheet, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)' },
    xlsx: { icon: FileSpreadsheet, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)' },
    csv: { icon: FileSpreadsheet, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)' },

    // Code
    js: { icon: FileCode, color: '#FACC15', bg: 'rgba(250, 204, 21, 0.1)' },
    jsx: { icon: FileCode, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.1)' },
    ts: { icon: FileCode, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    tsx: { icon: FileCode, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    html: { icon: FileCode, color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' },
    css: { icon: FileCode, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    scss: { icon: FileCode, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' },
    py: { icon: FileCode, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    go: { icon: FileCode, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.1)' },
    rs: { icon: FileCode, color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' },
    java: { icon: FileCode, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
    php: { icon: FileCode, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    rb: { icon: FileCode, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
    c: { icon: FileCode, color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
    cpp: { icon: FileCode, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    h: { icon: FileCode, color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
    sh: { icon: FileCode, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)' },
    sql: { icon: FileCode, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },

    // Data
    json: { icon: FileJson, color: '#FACC15', bg: 'rgba(250, 204, 21, 0.1)' },
    xml: { icon: FileCode, color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' },
    yaml: { icon: FileCode, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
    yml: { icon: FileCode, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },

    // Archives
    zip: { icon: FileArchive, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    rar: { icon: FileArchive, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    '7z': { icon: FileArchive, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    tar: { icon: FileArchive, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    gz: { icon: FileArchive, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },

    // Fonts
    ttf: { icon: FileType, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    otf: { icon: FileType, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    woff: { icon: FileType, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    woff2: { icon: FileType, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
}

// Default for unknown file types
const defaultFileType = { icon: File, color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' }

// Folder styling
const folderType = { icon: Folder, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' }
const folderOpenType = { icon: FolderOpen, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' }

export function getFileTypeInfo(filename, isDir = false, isOpen = false) {
    if (isDir) {
        return isOpen ? folderOpenType : folderType
    }

    const ext = filename.split('.').pop()?.toLowerCase() || ''
    return fileTypeMap[ext] || defaultFileType
}

export function isImageFile(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)
}

export function isVideoFile(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    return ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext)
}

export function isAudioFile(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    return ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)
}
