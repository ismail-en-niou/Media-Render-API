import { useEffect, useMemo , useRef} from 'react'

function ClipCard({ clip, index, total, effectOptions, onMove, onRemove, onUpdate }) {
  const createdUrlRef = useRef(null)
  const previewUrl = useMemo(() => {
    if (clip.preview) {
      return clip.preview
    }
    if (!clip.file) {
      return ''
    }
    const url = URL.createObjectURL(clip.file)
    createdUrlRef.current = url
    return url
  }, [clip.preview, clip.file])

  useEffect(() => {
    return () => {
      if (createdUrlRef.current) {
        URL.revokeObjectURL(createdUrlRef.current)
      }
    }
  }, [])

  return (
    <div className="clip-row">
      <div className="clip-preview">
        {previewUrl ? (
          clip.type === 'video' ? (
            <video src={previewUrl} muted />
          ) : (
            <img src={previewUrl} alt={clip.name} />
          )
        ) : (
          <div className="clip-fallback">No preview</div>
        )}
      </div>
      <div>
        <p className="clip-title">{clip.name}</p>
        <p className="clip-meta">
          {clip.type === 'image' ? 'Image clip' : 'Video clip'}
        </p>
        <p className="clip-meta">#{index + 1} of {total}</p>
      </div>

      <div>
        <label>Duration</label>
        <input
          className="input"
          type="number"
          step="0.1"
          min="0"
          disabled={clip.type !== 'image'}
          value={clip.duration}
          onChange={(event) =>
            onUpdate(clip.id, { duration: event.target.value })
          }
        />
      </div>

      <div>
        <label>Effect</label>
        <select
          className="select"
          value={clip.effect}
          onChange={(event) =>
            onUpdate(clip.id, { effect: event.target.value })
          }
        >
          {effectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Caption</label>
        <input
          className="input"
          type="text"
          value={clip.text}
          placeholder="Optional overlay text"
          onChange={(event) =>
            onUpdate(clip.id, { text: event.target.value })
          }
        />
        <div className="inline-fields">
          <input
            className="input"
            type="number"
            step="0.1"
            placeholder="Start"
            value={clip.textStart}
            onChange={(event) =>
              onUpdate(clip.id, { textStart: event.target.value })
            }
          />
          <input
            className="input"
            type="number"
            step="0.1"
            placeholder="End"
            value={clip.textEnd}
            onChange={(event) =>
              onUpdate(clip.id, { textEnd: event.target.value })
            }
          />
        </div>
      </div>

      <div className="clip-actions">
        <button
          type="button"
          className="button ghost"
          onClick={() => onMove(index, -1)}
          aria-label="Move clip up"
        >
          Up
        </button>
        <button
          type="button"
          className="button ghost"
          onClick={() => onMove(index, 1)}
          aria-label="Move clip down"
        >
          Down
        </button>
        <button
          type="button"
          className="button danger"
          onClick={() => onRemove(clip.id)}
        >
          Remove
        </button>
      </div>
    </div>
  )
}

export default ClipCard
