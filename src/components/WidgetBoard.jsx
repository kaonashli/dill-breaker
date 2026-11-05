import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { chartColors } from '../lib/colors'
import { useStats } from '../lib/useStats'
import { DEFAULT_WIDGETS, WIDGETS } from './widgets'

// One draggable card. useSortable gives us the drag handle props + position.
function SortableWidget({ id, onRemove, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
  }
  return (
    <section ref={setNodeRef} style={style} className="card widget">
      <header className="widget-head">
        <button className="drag-handle" aria-label={`Move ${WIDGETS[id].title}`} {...attributes} {...listeners}>
          ⠿
        </button>
        <h2>{WIDGETS[id].title}</h2>
        <button className="btn btn-ghost btn-sm" aria-label={`Remove ${WIDGETS[id].title}`} onClick={onRemove}>
          ✕
        </button>
      </header>
      <div className="widget-body">{children}</div>
    </section>
  )
}

// The dashboard grid: drag to reorder, ✕ to remove, dropdown to add back.
// The layout is saved to user_settings.widgets.
export default function WidgetBoard({ players, refreshToken }) {
  const { user, settings, setSettings } = useAuth()
  const { isDark } = useTheme()
  const colors = chartColors(isDark)
  const { stats, error } = useStats(players, refreshToken)

  const widgetIds = (settings?.widgets || DEFAULT_WIDGETS).filter((id) => WIDGETS[id])
  const hidden = Object.keys(WIDGETS).filter((id) => !widgetIds.includes(id))

  // Mouse/touch drag (moves 5px before it counts as a drag) + keyboard (space + arrows)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function saveWidgets(next) {
    setSettings((s) => ({ ...s, widgets: next })) // update screen right away
    await supabase
      .from('user_settings')
      .update({ widgets: next, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const from = widgetIds.indexOf(active.id)
    const to = widgetIds.indexOf(over.id)
    saveWidgets(arrayMove(widgetIds, from, to))
  }

  return (
    <div>
      {hidden.length > 0 && (
        <div className="widget-add">
          <select value="" onChange={(e) => saveWidgets([...widgetIds, e.target.value])} aria-label="Add widget">
            <option value="">+ Add widget...</option>
            {hidden.map((id) => <option key={id} value={id}>{WIDGETS[id].title}</option>)}
          </select>
        </div>
      )}

      {error && <p className="form-error">Couldn't load stats: {error}</p>}
      {players.length === 0 && <p className="muted">Pick someone to show stats for.</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
          <div className="widget-grid">
            {widgetIds.map((id) => {
              const Widget = WIDGETS[id].component
              return (
                <SortableWidget key={id} id={id} onRemove={() => saveWidgets(widgetIds.filter((w) => w !== id))}>
                  {/* Keep showing the old charts while new data loads, so nothing jumps */}
                  {!stats ? (
                    <p className="muted">Loading...</p>
                  ) : (
                    <Widget players={players} stats={stats} colors={colors} />
                  )}
                </SortableWidget>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
