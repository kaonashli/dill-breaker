import ThemeToggle from './ThemeToggle'
import PickleLogo from './PickleLogo'
import Credit from './Credit'

// Centered card used by the login and sign-up pages
export default function AuthCard({ title, children }) {
  return (
    <div className="auth-page">
      <div className="auth-theme"><ThemeToggle /></div>
      <div className="auth-card card">
        <div className="auth-brand"><PickleLogo size={30} /> Dill Breaker</div>
        {/* Short intro for people who've never seen the app */}
        <p className="auth-intro">Track your pickleball games and compare stats with friends.</p>
        <h1>{title}</h1>
        {children}
      </div>
      {/* small print under the card */}
      <Credit whatsNew />
    </div>
  )
}
