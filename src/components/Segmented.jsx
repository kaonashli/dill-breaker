// A row of toggle buttons where one can be picked (like radio buttons).
// options: [[value, label], ...]
// allowClear: clicking the selected one again un-selects it (for optional fields)
export default function Segmented({ options, value, onChange, allowClear = false, ariaLabel }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map(([optionValue, label]) => {
        const selected = value === optionValue
        return (
          <button
            key={String(optionValue)}
            type="button"
            role="radio"
            aria-checked={selected}
            className={selected ? 'selected' : ''}
            onClick={() => onChange(selected && allowClear ? '' : optionValue)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
