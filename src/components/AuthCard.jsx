import ThemeToggle from './ThemeToggle'

// Centered card used by the login and sign-up pages
export default function AuthCard({ title, children }) {
  return (
    <div className="auth-page">
      <div className="auth-theme"><ThemeToggle /></div>
      <div className="auth-card card">
        <div className="auth-brand"><span aria-hidden="true">🥒</span> Dill Breaker</div>
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  )
}
