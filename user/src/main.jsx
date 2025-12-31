import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/contexts/ThemeContext'
import App from './App'
import '@/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <TooltipProvider>
                    <App />
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            style: {
                                background: 'hsl(222.2 84% 4.9%)',
                                color: 'hsl(210 40% 98%)',
                                border: '1px solid hsl(217.2 32.6% 17.5%)',
                            },
                        }}
                        richColors
                    />
                </TooltipProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>,
)
