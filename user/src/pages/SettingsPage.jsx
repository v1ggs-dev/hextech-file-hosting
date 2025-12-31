import { useState, useEffect } from 'react'
import { settingsApi } from '@/api/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTheme } from '@/contexts/ThemeContext'
import { Save, Loader2, Sun, Moon, Palette, HardDrive, Shield, Check, Settings, AlertTriangle, X, ShieldCheck, RotateCcw, Plus } from 'lucide-react'

function SettingsPage() {
    const { theme, setTheme, accentColor, setAccentColor, themeColors } = useTheme()
    const isDark = theme === 'dark'

    const [settings, setSettings] = useState({
        base_directory: '',
        max_upload_size: 0,
        blocked_extensions: [],
        public_hostname: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // Theme colors
    const bgColor = isDark ? 'hsl(222.2 84% 4.9%)' : 'white'
    const borderColor = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)'
    const textColor = isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
    const mutedText = isDark ? 'hsl(215 20.2% 65.1%)' : 'hsl(215.4 16.3% 46.9%)'
    const cardBg = isDark ? 'hsl(217.2 32.6% 8%)' : 'white'

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await settingsApi.get()
            setSettings(response.data)
        } catch (err) {
            setError('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setError(null)

            await settingsApi.update({
                base_directory: settings.base_directory,
                max_upload_size: settings.max_upload_size,
                blocked_extensions: settings.blocked_extensions,
                public_hostname: settings.public_hostname
            })

            toast.success('Settings saved successfully')
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save settings')
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }


    const formatBytes = (bytes) => {
        const mb = bytes / (1024 * 1024)
        return `${mb.toFixed(0)} MB`
    }

    // Extension input state
    const [extensionInput, setExtensionInput] = useState('')
    const [extensionError, setExtensionError] = useState('')

    // Default blocked extensions preset
    const defaultExtensions = ['php', 'exe', 'sh', 'bat', 'cmd', 'ps1', 'vbs', 'js', 'jar', 'msi', 'dll', 'scr', 'pif', 'com']
    const commonExecutables = ['exe', 'msi', 'dll', 'scr', 'bat', 'cmd', 'com', 'pif', 'vbs', 'ps1', 'jar']

    // Validate extension format
    const isValidExtension = (ext) => {
        return /^[a-z0-9]+$/.test(ext) && ext.length > 0 && ext.length <= 10
    }

    // Normalize extension (trim, lowercase, remove leading dots)
    const normalizeExtension = (ext) => {
        return ext.trim().toLowerCase().replace(/^\.+/, '')
    }

    // Add extension
    const addExtension = (ext) => {
        const normalized = normalizeExtension(ext)
        if (!normalized) return

        if (!isValidExtension(normalized)) {
            setExtensionError(`"${ext}" is not a valid extension`)
            return
        }

        if (settings.blocked_extensions.includes(normalized)) {
            setExtensionError(`"${normalized}" is already blocked`)
            return
        }

        setSettings({ ...settings, blocked_extensions: [...settings.blocked_extensions, normalized] })
        setExtensionInput('')
        setExtensionError('')
    }

    // Remove extension
    const removeExtension = (ext) => {
        setSettings({ ...settings, blocked_extensions: settings.blocked_extensions.filter(e => e !== ext) })
    }

    // Handle input keydown (Enter or comma to add)
    const handleExtensionKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addExtension(extensionInput)
        } else if (e.key === 'Backspace' && !extensionInput && settings.blocked_extensions.length > 0) {
            // Remove last extension on backspace if input is empty
            removeExtension(settings.blocked_extensions[settings.blocked_extensions.length - 1])
        }
    }

    // Handle input blur (add on blur)
    const handleExtensionBlur = () => {
        if (extensionInput.trim()) {
            addExtension(extensionInput)
        }
    }

    // Add preset extensions
    const addPresetExtensions = (preset) => {
        const newExtensions = [...new Set([...settings.blocked_extensions, ...preset])]
        setSettings({ ...settings, blocked_extensions: newExtensions })
        setExtensionError('')
    }

    // Reset to defaults
    const resetToDefaults = () => {
        setSettings({ ...settings, blocked_extensions: [...defaultExtensions] })
        setExtensionError('')
    }

    const themeOptions = [
        { value: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright', iconBg: 'hsl(210 40% 96.1%)', iconColor: 'hsl(222.2 84% 20%)' },
        { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes', iconBg: 'hsl(222.2 84% 10%)', iconColor: 'hsl(210 40% 90%)' },
    ]

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: bgColor }}>
                <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }} className="animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <ScrollArea className="page-transition" style={{ height: '100%', backgroundColor: bgColor }}>
            <div style={{ padding: '24px' }}>
                {/* Page Header - consistent with Files and Logs pages */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 24
                }}>
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
                            <Settings style={{ width: 20, height: 20, color: `hsl(${accentColor.value})` }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: textColor }}>Configuration</h1>
                            <p style={{ fontSize: 13, color: mutedText, margin: 0 }}>Customize your panel settings and preferences</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{
                        marginBottom: 24,
                        padding: '12px 16px',
                        borderRadius: 8,
                        backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.1)',
                        color: 'hsl(0 84.2% 60.2%)',
                        fontSize: 13
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Appearance Section */}
                    <Card style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
                        <CardHeader style={{ paddingBottom: 16 }}>
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
                                    <Palette style={{ width: 18, height: 18, color: `hsl(${accentColor.value})` }} />
                                </div>
                                <div>
                                    <CardTitle style={{ fontSize: 16, color: textColor }}>Appearance</CardTitle>
                                    <CardDescription>Customize how the panel looks</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Theme Mode */}
                            <div>
                                <Label style={{ marginBottom: 12, display: 'block', fontWeight: 500, color: textColor }}>Theme Mode</Label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {themeOptions.map((option) => {
                                        const Icon = option.icon
                                        const isSelected = theme === option.value

                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => setTheme(option.value)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    padding: 16,
                                                    borderRadius: 10,
                                                    border: `2px solid ${isSelected ? `hsl(${accentColor.value})` : borderColor}`,
                                                    backgroundColor: isSelected ? `hsla(${accentColor.value}, 0.08)` : 'transparent',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 8,
                                                    backgroundColor: option.iconBg,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Icon style={{ width: 20, height: 20, color: option.iconColor }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{option.label}</div>
                                                    <div style={{ fontSize: 12, color: mutedText }}>{option.desc}</div>
                                                </div>
                                                {isSelected && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8,
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '50%',
                                                        backgroundColor: `hsl(${accentColor.value})`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <Check style={{ width: 12, height: 12, color: 'white' }} />
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Accent Color */}
                            <div>
                                <Label style={{ marginBottom: 12, display: 'block', fontWeight: 500, color: textColor }}>Accent Color</Label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {themeColors.map((color) => {
                                        const isSelected = accentColor.name === color.name
                                        return (
                                            <button
                                                key={color.name}
                                                onClick={() => setAccentColor(color)}
                                                title={color.name}
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 10,
                                                    border: isSelected ? `3px solid ${textColor}` : '3px solid transparent',
                                                    backgroundColor: `hsl(${color.value})`,
                                                    cursor: 'pointer',
                                                    outline: 'none',
                                                    transition: 'transform 150ms',
                                                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                                }}
                                            />
                                        )
                                    })}
                                </div>
                                <p style={{ fontSize: 12, color: mutedText, marginTop: 8 }}>
                                    Selected: <span style={{ color: `hsl(${accentColor.value})`, fontWeight: 500 }}>{accentColor.name}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* File Storage Section */}
                    <Card style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
                        <CardHeader style={{ paddingBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    backgroundColor: 'hsla(217, 91%, 60%, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <HardDrive style={{ width: 18, height: 18, color: 'hsl(217 91% 60%)' }} />
                                </div>
                                <div>
                                    <CardTitle style={{ fontSize: 16, color: textColor }}>File Storage</CardTitle>
                                    <CardDescription>Configure storage and serving options</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <Label htmlFor="base_directory" style={{ color: textColor }}>Base Directory</Label>
                                <Input
                                    id="base_directory"
                                    value={settings.base_directory}
                                    onChange={(e) => setSettings({ ...settings, base_directory: e.target.value })}
                                    placeholder="/srv/cdn"
                                    style={{ marginTop: 6 }}
                                />
                                <p style={{ fontSize: 12, color: mutedText, marginTop: 4 }}>Root directory for file storage</p>
                            </div>

                            <div>
                                <Label htmlFor="public_hostname" style={{ color: textColor }}>Public Hostname</Label>
                                <Input
                                    id="public_hostname"
                                    value={settings.public_hostname}
                                    onChange={(e) => setSettings({ ...settings, public_hostname: e.target.value })}
                                    placeholder="cdn.yourdomain.com"
                                    style={{ marginTop: 6 }}
                                />
                                <p style={{ fontSize: 12, color: mutedText, marginTop: 4 }}>Domain used for public file URLs</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upload Restrictions Section */}
                    <Card style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
                        <CardHeader style={{ paddingBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    backgroundColor: 'hsla(142, 76%, 36%, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Shield style={{ width: 18, height: 18, color: 'hsl(142 76% 36%)' }} />
                                </div>
                                <div>
                                    <CardTitle style={{ fontSize: 16, color: textColor }}>Upload Restrictions</CardTitle>
                                    <CardDescription>Control upload limits and file types</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <Label htmlFor="max_upload_size" style={{ color: textColor }}>
                                    Max Upload Size
                                    <span style={{ color: mutedText, fontWeight: 400, marginLeft: 8 }}>
                                        ({formatBytes(settings.max_upload_size)})
                                    </span>
                                </Label>
                                <Input
                                    id="max_upload_size"
                                    type="number"
                                    value={settings.max_upload_size}
                                    onChange={(e) => setSettings({ ...settings, max_upload_size: parseInt(e.target.value) || 0 })}
                                    style={{ marginTop: 6 }}
                                />
                                <p style={{ fontSize: 12, color: mutedText, marginTop: 4 }}>Maximum file size in bytes</p>
                            </div>

                            <div>
                                {/* Label with security icon */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <ShieldCheck style={{ width: 16, height: 16, color: 'hsl(142 76% 36%)' }} />
                                    <Label htmlFor="blocked_extensions" style={{ color: textColor, fontWeight: 600, margin: 0 }}>
                                        Blocked Extensions
                                    </Label>
                                </div>

                                {/* Chip container */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 6,
                                        padding: '10px 12px',
                                        minHeight: 48,
                                        borderRadius: 8,
                                        border: `1px solid ${extensionError ? 'hsl(0 84% 60%)' : borderColor}`,
                                        backgroundColor: isDark ? 'hsl(217.2 32.6% 12%)' : 'white',
                                        transition: 'border-color 150ms'
                                    }}
                                    onClick={() => document.getElementById('extension_input')?.focus()}
                                >
                                    {/* Extension chips */}
                                    {settings.blocked_extensions.map((ext) => (
                                        <span
                                            key={ext}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                padding: '4px 8px',
                                                borderRadius: 6,
                                                backgroundColor: isDark ? 'hsla(142, 76%, 36%, 0.15)' : 'hsla(142, 76%, 36%, 0.1)',
                                                color: isDark ? 'hsl(142 76% 70%)' : 'hsl(142 76% 30%)',
                                                fontSize: 13,
                                                fontWeight: 500,
                                                fontFamily: 'monospace'
                                            }}
                                        >
                                            .{ext}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeExtension(ext) }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: 4,
                                                    border: 'none',
                                                    backgroundColor: 'transparent',
                                                    color: 'inherit',
                                                    cursor: 'pointer',
                                                    opacity: 0.6,
                                                    transition: 'opacity 100ms'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                            >
                                                <X style={{ width: 12, height: 12 }} />
                                            </button>
                                        </span>
                                    ))}

                                    {/* Input field */}
                                    <input
                                        id="extension_input"
                                        type="text"
                                        value={extensionInput}
                                        onChange={(e) => { setExtensionInput(e.target.value); setExtensionError('') }}
                                        onKeyDown={handleExtensionKeyDown}
                                        onBlur={handleExtensionBlur}
                                        placeholder={settings.blocked_extensions.length === 0 ? "Type extension and press Enter..." : "Add more..."}
                                        style={{
                                            flex: 1,
                                            minWidth: 100,
                                            border: 'none',
                                            outline: 'none',
                                            backgroundColor: 'transparent',
                                            fontSize: 14,
                                            color: textColor,
                                            padding: '4px 0'
                                        }}
                                    />
                                </div>

                                {/* Error message */}
                                {extensionError && (
                                    <p style={{ fontSize: 12, color: 'hsl(0 84% 60%)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <AlertTriangle style={{ width: 12, height: 12 }} />
                                        {extensionError}
                                    </p>
                                )}

                                {/* Helper text and impact counter */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                                    <p style={{ fontSize: 12, color: mutedText, margin: 0 }}>
                                        Enter extensions without dots (e.g. php, exe, sh). These uploads will be rejected.
                                    </p>
                                    <span style={{
                                        fontSize: 11,
                                        color: settings.blocked_extensions.length > 0 ? 'hsl(142 76% 45%)' : mutedText,
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        Blocking {settings.blocked_extensions.length} type{settings.blocked_extensions.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Preset buttons */}
                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    <button
                                        type="button"
                                        onClick={() => addPresetExtensions(commonExecutables)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '6px 12px',
                                            borderRadius: 6,
                                            border: `1px solid ${borderColor}`,
                                            backgroundColor: 'transparent',
                                            color: mutedText,
                                            fontSize: 12,
                                            cursor: 'pointer',
                                            transition: 'all 120ms'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = isDark ? 'hsla(217.2, 32.6%, 22%, 0.5)' : 'hsla(214.3, 31.8%, 91.4%, 0.7)'
                                            e.currentTarget.style.color = textColor
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent'
                                            e.currentTarget.style.color = mutedText
                                        }}
                                    >
                                        <Plus style={{ width: 12, height: 12 }} />
                                        Add executables
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetToDefaults}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '6px 12px',
                                            borderRadius: 6,
                                            border: `1px solid ${borderColor}`,
                                            backgroundColor: 'transparent',
                                            color: mutedText,
                                            fontSize: 12,
                                            cursor: 'pointer',
                                            transition: 'all 120ms'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = isDark ? 'hsla(217.2, 32.6%, 22%, 0.5)' : 'hsla(214.3, 31.8%, 91.4%, 0.7)'
                                            e.currentTarget.style.color = textColor
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent'
                                            e.currentTarget.style.color = mutedText
                                        }}
                                    >
                                        <RotateCcw style={{ width: 12, height: 12 }} />
                                        Reset to defaults
                                    </button>
                                </div>

                                {/* Nginx reminder */}
                                <div style={{
                                    marginTop: 16,
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    backgroundColor: isDark ? 'hsla(38, 92%, 50%, 0.1)' : 'hsla(38, 92%, 50%, 0.08)',
                                    border: `1px solid ${isDark ? 'hsla(38, 92%, 50%, 0.3)' : 'hsla(38, 92%, 50%, 0.25)'}`,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 10
                                }}>
                                    <AlertTriangle style={{
                                        width: 16,
                                        height: 16,
                                        color: 'hsl(38 92% 50%)',
                                        flexShrink: 0,
                                        marginTop: 1
                                    }} />
                                    <div style={{ fontSize: 12, color: isDark ? 'hsl(38 92% 70%)' : 'hsl(38 92% 35%)' }}>
                                        <strong>Important:</strong> After changing blocked extensions, also update your <code style={{
                                            backgroundColor: isDark ? 'hsla(0,0%,100%,0.1)' : 'hsla(0,0%,0%,0.06)',
                                            padding: '1px 4px',
                                            borderRadius: 4,
                                            fontFamily: 'monospace',
                                            fontSize: 11
                                        }}>nginx.conf</code> to match.
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                        <Button onClick={handleSave} disabled={saving} size="lg">
                            {saving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </div>
        </ScrollArea>
    )
}

export default SettingsPage
