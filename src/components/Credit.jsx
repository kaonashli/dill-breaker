// Small "Developed by" credit with a link to the project on GitHub
export const GITHUB_URL = 'https://github.com/kaonashli/dill-breaker/blob/main/README.md'

export default function Credit() {
  return (
    <p className="credit">
      Developed by{' '}
      <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">kaonashli</a>
    </p>
  )
}
