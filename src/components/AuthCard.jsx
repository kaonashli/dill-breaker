import ThemeToggle from './ThemeToggle'

// Centered card used by the login and sign-up pages
export default function AuthCard({ title, children }) {
  return (
    <div className="auth-page">
      <div className="auth-theme"><ThemeToggle /></div>
      <div className="auth-card card">
        <div className="auth-brand"><span aria-hidden="true">🥒</span> Dill Breaker</div>
        {/* Short intro for people who've never seen the app */}
        <p className="auth-intro">
          A pickleball score keeper. Log your games and matches, add friends (even ones
          without an account), and see your stats: wins, points, how often you play, and
          who you play best with. Compare yourself with friends on a dashboard you can
          arrange however you like.
        </p>
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  )
}
