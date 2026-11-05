import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ThemeIcon from './ThemeIcon'

// Cycles: system -> light -> dark -> system
const NEXT = { system: 'light', light: 'dark', dark: 'system' }
const LABEL = { system: 'System theme', light: 'Light mode', dark: 'Dark mode' }

export default function ThemeToggle() {
  const { theme } = useTheme()
  const { saveTheme } = useAuth()

  return (
    <button
      className="btn btn-ghost btn-sm icon-btn"
      onClick={() => saveTheme(NEXT[theme])}
      title={`${LABEL[theme]} (click to change)`}
      aria-label={`${LABEL[theme]}, click to change`}
    >
      <ThemeIcon theme={theme} />
    </button>
  )
}
