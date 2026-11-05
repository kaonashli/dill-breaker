import { useEffect } from 'react'
import { CURRENT_VERSION, RELEASES, markReleaseSeen } from '../lib/releases'
import Credit from '../components/Credit'

// "What's new": friendly release notes, newest first
export default function WhatsNew() {
  // Opening this page counts as having seen the latest notes
  useEffect(() => {
    markReleaseSeen()
  }, [])

  return (
    <div className="narrow stack">
      <div>
        <h1>What's new</h1>
        <p className="muted">
          You're on version {CURRENT_VERSION}. Dill Breaker is still in development, so expect more soon!
        </p>
      </div>

      {RELEASES.map((release, i) => (
        <section className="card release" key={release.version}>
          <div className="release-head">
            <span className="release-version">v{release.version}</span>
            {i === 0 && <span className="release-latest">Latest</span>}
            <span className="muted small release-date">
              {new Date(`${release.date}T12:00:00`).toLocaleDateString(undefined, {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
          <h2>{release.title}</h2>
          <ul className="release-notes">
            {release.notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </section>
      ))}

      <Credit />
    </div>
  )
}
