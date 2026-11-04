import { createContext, useContext, useEffect, useState } from 'react'

// theme is one of: 'light' | 'dark' | 'system'
// isDark is the *resolved* value (what's actually showing), used by the charts.
const ThemeContext = createContext(null)

// First-time visitors (nothing saved yet) get dark mode
const DEFAULT_THEME = 'dark'

function readStoredTheme() {
  try {
    return localStorage.getItem('theme') || DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // Follow the operating system setting when theme = 'system'
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Put data-theme on <html> so the CSS in index.css can switch colors
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* private mode etc. - not important */
    }
  }, [theme])

  const isDark = theme === 'dark' || (theme === 'system' && systemDark)

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
