// 1-5 stars. Click the current rating again to clear it (0 = no rating).
export default function StarRating({ value, onChange }) {
  return (
    <div className="stars" role="radiogroup" aria-label="Fun rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={n <= value ? 'star on' : 'star'}
          onClick={() => onChange(value === n ? 0 : n)}
        >
          ★
        </button>
      ))}
    </div>
  )
}
