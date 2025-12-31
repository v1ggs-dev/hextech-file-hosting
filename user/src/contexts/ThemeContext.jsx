import { createContext, useContext, useState, useEffect } from 'react'

const themeColors = [
    { name: 'Orange', value: '24 95% 53%' },
    { name: 'Blue', value: '217 91% 60%' },
    { name: 'Green', value: '142 76% 36%' },
    { name: 'Purple', value: '262 83% 58%' },
    { name: 'Pink', value: '330 81% 60%' },
    { name: 'Cyan', value: '189 94% 43%' },
]

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme')
        return saved || 'light'
    })

    const [accentColor, setAccentColor] = useState(() => {
        const saved = localStorage.getItem('accentColor')
        return saved ? themeColors.find(c => c.name === saved) || themeColors[0] : themeColors[0]
    })

    useEffect(() => {
        // Apply theme
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('theme', theme)
    }, [theme])

    useEffect(() => {
        // Apply accent color
        document.documentElement.style.setProperty('--primary', accentColor.value)
        document.documentElement.style.setProperty('--ring', accentColor.value)
        document.documentElement.style.setProperty('--sidebar-primary', accentColor.value)
        document.documentElement.style.setProperty('--sidebar-ring', accentColor.value)
        localStorage.setItem('accentColor', accentColor.name)
    }, [accentColor])

    return (
        <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor, themeColors }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
