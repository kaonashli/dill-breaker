import { NavLink } from 'react-router-dom'

// Simple line icons (24x24) so we don't need an icon library
const ICONS = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  games: (
    <>
      <path d="M9 6h12M9 12h12M9 18h12" />
      <circle cx="4.5" cy="6" r="1" />
      <circle cx="4.5" cy="12" r="1" />
      <circle cx="4.5" cy="18" r="1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  friends: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16.5 14.6A5 5 0 0 1 21.5 20" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
}

function Icon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

const TABS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/games', label: 'Games', icon: 'games', end: true },
  { to: '/games/new', label: 'Log', icon: 'plus', primary: true },
  { to: '/friends', label: 'Friends', icon: 'friends' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
]

// App-style tab bar fixed to the bottom of the screen. Only shown on phones (see CSS).
export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={tab.primary ? 'tab-primary' : ''}>
          <Icon name={tab.icon} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
