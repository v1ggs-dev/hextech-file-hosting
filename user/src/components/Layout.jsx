import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme } from '@/contexts/ThemeContext'
import {
    FolderOpen,
    History,
    Settings,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    LogOut
} from 'lucide-react'

function Layout() {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const { theme, accentColor } = useTheme()
    const location = useLocation()

    const isDark = theme === 'dark'

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
            if (window.innerWidth >= 768) {
                setMobileOpen(false)
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false)
    }, [location.pathname])

    const navItems = [
        { to: '/files', icon: FolderOpen, label: 'Files' },
        { to: '/logs', icon: History, label: 'Activity Log' },
        { to: '/settings', icon: Settings, label: 'Configuration' },
    ]

    const isActive = (path) => {
        if (path === '/files') return location.pathname.startsWith('/files')
        return location.pathname === path
    }

    // Theme-aware colors
    const sidebarBg = isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(210 40% 98%)'
    const sidebarText = isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
    const sidebarTextMuted = isDark ? 'hsla(210, 40%, 98%, 0.6)' : 'hsla(222.2, 84%, 4.9%, 0.6)'
    const sidebarBorder = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)'
    const mainBg = isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)'
    const mainText = isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
    const mainBorder = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)'


    // Hover background (subtle neutral)
    const hoverBg = isDark ? 'hsla(217.2, 32.6%, 22%, 0.5)' : 'hsla(214.3, 31.8%, 91.4%, 0.7)'

    const SidebarContent = ({ isMobileSidebar = false }) => (
        <>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 56,
                    padding: collapsed && !isMobileSidebar ? '0' : '0 16px',
                    justifyContent: collapsed && !isMobileSidebar ? 'center' : 'space-between',
                    borderBottom: `1px solid ${sidebarBorder}`,
                    gap: 12
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: `hsl(${accentColor.value})`,
                            padding: 4,
                            flexShrink: 0
                        }}
                    >
                        <img
                            src="/hextech-logo.svg"
                            alt="Hextech Logo"
                            style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }}
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                    </div>
                    {(!collapsed || isMobileSidebar) && (
                        <div style={{
                            transition: 'opacity 150ms ease',
                            opacity: 1,
                            whiteSpace: 'nowrap'
                        }}>
                            <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2, color: sidebarText }}>Hextech</div>
                            <div style={{ fontSize: 9, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 2, color: sidebarTextMuted }}>File Hosting</div>
                            <div style={{ fontSize: 9, opacity: 0.35, marginTop: 2, color: sidebarTextMuted }}>v1.1.2</div>
                        </div>
                    )}
                </div>
                {isMobileSidebar && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: sidebarTextMuted,
                            cursor: 'pointer',
                            padding: 4
                        }}
                    >
                        <X style={{ width: 20, height: 20, strokeWidth: 1.75 }} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: collapsed && !isMobileSidebar ? '0 8px' : '0 12px' }}>
                    {navItems.map((item) => {
                        const active = isActive(item.to)
                        const Icon = item.icon

                        return (
                            <li key={item.to} style={{ marginBottom: 4 }}>
                                <Tooltip delayDuration={collapsed && !isMobileSidebar ? 100 : 700}>
                                    <TooltipTrigger asChild>
                                        <NavLink
                                            to={item.to}
                                            style={{
                                                position: 'relative',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                height: 40,
                                                padding: collapsed && !isMobileSidebar ? '0' : '0 12px',
                                                justifyContent: collapsed && !isMobileSidebar ? 'center' : 'flex-start',
                                                borderRadius: 8,
                                                fontSize: 14,
                                                fontWeight: active ? 600 : 500,
                                                textDecoration: 'none',
                                                transition: 'all 120ms ease',
                                                backgroundColor: active ? `hsla(${accentColor.value}, 0.12)` : 'transparent',
                                                color: active ? `hsl(${accentColor.value})` : sidebarTextMuted,
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!active) {
                                                    e.currentTarget.style.backgroundColor = hoverBg
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!active) {
                                                    e.currentTarget.style.backgroundColor = 'transparent'
                                                }
                                            }}
                                        >
                                            {/* Active indicator pill */}
                                            {active && (!collapsed || isMobileSidebar) && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    width: 3,
                                                    height: 20,
                                                    borderRadius: '0 4px 4px 0',
                                                    backgroundColor: `hsl(${accentColor.value})`
                                                }} />
                                            )}
                                            <Icon style={{ width: 18, height: 18, flexShrink: 0, strokeWidth: 1.75 }} />
                                            {(!collapsed || isMobileSidebar) && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                                        </NavLink>
                                    </TooltipTrigger>
                                    {collapsed && !isMobileSidebar && (
                                        <TooltipContent side="right" sideOffset={12}>
                                            {item.label}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </li>
                        )
                    })}
                </ul>

                {/* Sign Out - at bottom with separator */}
                <div style={{
                    marginTop: 'auto',
                    padding: collapsed && !isMobileSidebar ? '0 8px' : '0 12px',
                    borderTop: `1px solid ${sidebarBorder}`,
                    paddingTop: 12
                }}>
                    <Tooltip delayDuration={collapsed && !isMobileSidebar ? 100 : 700}>
                        <TooltipTrigger asChild>
                            <a
                                href="/cdn-cgi/access/logout"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    height: 40,
                                    padding: collapsed && !isMobileSidebar ? '0' : '0 12px',
                                    justifyContent: collapsed && !isMobileSidebar ? 'center' : 'flex-start',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                    transition: 'all 120ms ease',
                                    backgroundColor: 'transparent',
                                    color: sidebarTextMuted,
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = hoverBg
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <LogOut style={{ width: 18, height: 18, flexShrink: 0, strokeWidth: 1.75 }} />
                                {(!collapsed || isMobileSidebar) && <span style={{ whiteSpace: 'nowrap' }}>Sign Out</span>}
                            </a>
                        </TooltipTrigger>
                        {collapsed && !isMobileSidebar && (
                            <TooltipContent side="right" sideOffset={12}>
                                Sign Out
                            </TooltipContent>
                        )}
                    </Tooltip>
                </div>
            </nav>

            {/* Footer - Collapse button */}
            <div style={{ borderTop: `1px solid ${sidebarBorder}`, padding: '12px' }}>
                {!isMobileSidebar && (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    height: 40,
                                    width: '100%',
                                    padding: collapsed ? '0' : '0 12px',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: 'transparent',
                                    color: sidebarTextMuted,
                                    transition: 'all 120ms ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = hoverBg
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                {collapsed ? (
                                    <ChevronRight style={{ width: 18, height: 18, strokeWidth: 1.75 }} />
                                ) : (
                                    <>
                                        <ChevronLeft style={{ width: 18, height: 18, strokeWidth: 1.75 }} />
                                        <span style={{ whiteSpace: 'nowrap' }}>Collapse</span>
                                    </>
                                )}
                            </button>
                        </TooltipTrigger>
                        {collapsed && (
                            <TooltipContent side="right" sideOffset={12}>
                                Expand
                            </TooltipContent>
                        )}
                    </Tooltip>
                )}
            </div>
        </>
    )

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: mainBg, color: mainText }}>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 40
                    }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            {isMobile && (
                <aside
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: 260,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: sidebarBg,
                        color: sidebarText,
                        borderRight: `1px solid ${sidebarBorder}`,
                        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                        transition: 'transform 200ms',
                        zIndex: 50
                    }}
                >
                    <SidebarContent isMobileSidebar />
                </aside>
            )}

            {/* Desktop sidebar */}
            {!isMobile && (
                <aside
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: collapsed ? 64 : 220,
                        backgroundColor: sidebarBg,
                        color: sidebarText,
                        borderRight: `1px solid ${sidebarBorder}`,
                        transition: 'width 200ms',
                        flexShrink: 0
                    }}
                >
                    <SidebarContent />
                </aside>
            )}

            {/* Main Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: mainBg }}>
                {/* Mobile header - only shows menu button on mobile */}
                {isMobile && (
                    <header
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: 56,
                            padding: '0 16px',
                            borderBottom: `1px solid ${mainBorder}`,
                            backgroundColor: mainBg,
                            flexShrink: 0
                        }}
                    >
                        <button
                            onClick={() => setMobileOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                border: `1px solid ${mainBorder}`,
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                color: mainText
                            }}
                        >
                            <Menu style={{ width: 20, height: 20 }} />
                        </button>
                    </header>
                )}

                {/* Content */}
                <main style={{ flex: 1, overflow: 'hidden', backgroundColor: mainBg }}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Layout
