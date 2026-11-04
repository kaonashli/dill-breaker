// Dropdown to pick a friend or pickle pal.
// value / onChange use player keys like 'user:<id>' or 'pal:<id>' ('' = nobody)
// exclude: keys already picked elsewhere in the same game (shown disabled)
// people: { friends, pals, extra }  (extra = other players, e.g. when editing)
export default function PlayerSelect({ value, onChange, people, exclude = [], label }) {
  const taken = (key) => key !== value && exclude.includes(key)
  const extra = people.extra || []

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">Not recorded</option>
      {people.friends.length > 0 && (
        <optgroup label="Friends">
          {people.friends.map((p) => (
            <option key={p.key} value={p.key} disabled={taken(p.key)}>
              {p.name} (@{p.username})
            </option>
          ))}
        </optgroup>
      )}
      {people.pals.length > 0 && (
        <optgroup label="Pickle pals">
          {people.pals.map((p) => (
            <option key={p.key} value={p.key} disabled={taken(p.key)}>
              {p.name}
            </option>
          ))}
        </optgroup>
      )}
      {extra.length > 0 && (
        <optgroup label="Other players">
          {extra.map((p) => (
            <option key={p.key} value={p.key} disabled={taken(p.key)}>
              {p.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  )
}
