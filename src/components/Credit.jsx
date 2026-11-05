import { Link } from 'react-router-dom'

// Small "Developed by" credit with a link to the project on GitHub.
// whatsNew: also show a small link to the release notes (used on login / sign-up)
export const GITHUB_URL = 'https://github.com/kaonashli/dill-breaker/blob/main/README.md'

export default function Credit({ whatsNew = false }) {
  return (
    <p className="credit">
      Developed by{' '}
      <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">kaonashli</a>
      {whatsNew && (
        <>
          {' · '}
          <Link to="/whats-new">What's new</Link>
        </>
      )}
    </p>
  )
}
