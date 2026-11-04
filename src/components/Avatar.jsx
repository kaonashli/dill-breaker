// Round profile picture, or initials if there's no picture.
export default function Avatar({ name = '?', url, size = 36 }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

  const style = { width: size, height: size, fontSize: size * 0.4 }

  if (url) return <img className="avatar" src={url} alt="" style={style} />
  return (
    <span className="avatar avatar-initials" style={style} aria-hidden="true">
      {initials || '?'}
    </span>
  )
}
