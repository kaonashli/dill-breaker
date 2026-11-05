import { useState } from 'react'

// One photo at a time; swipe (or scroll) sideways for the next. Dots show where you are.
export default function PhotoCarousel({ photos }) {
  const [index, setIndex] = useState(0)
  if (!photos || photos.length === 0) return null

  function onScroll(e) {
    const el = e.currentTarget
    setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="carousel-wrap">
      <div className="carousel" onScroll={onScroll}>
        {photos.map((p, i) => (
          <img key={p.id} src={p.url} alt={`Photo ${i + 1} of ${photos.length}`} loading="lazy" draggable="false" />
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <span className="carousel-count">{index + 1}/{photos.length}</span>
          <div className="carousel-dots" aria-hidden="true">
            {photos.map((p, i) => <span key={p.id} className={i === index ? 'on' : ''} />)}
          </div>
        </>
      )}
    </div>
  )
}
