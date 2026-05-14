import ClipCard from './ClipCard.jsx'

function ClipsPanel({ clips, effectOptions, onMove, onRemove, onUpdate }) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Clips and captions</h2>
          <p>Preview your timeline and adjust clip captions.</p>
        </div>
      </div>

      {clips.length === 0 ? (
        <div className="empty-state">
          <p>No clips yet. Upload images or videos to begin.</p>
        </div>
      ) : (
        <div className="clip-timeline">
          <div className="clip-strip">
            {clips.map((clip) => (
              <div key={clip.id} className="clip-strip-item">
                <span>{clip.type === 'image' ? 'IMG' : 'VID'}</span>
                <p>{clip.name}</p>
              </div>
            ))}
          </div>
          <div className="clip-list">
            {clips.map((clip, index) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                index={index}
                total={clips.length}
                effectOptions={effectOptions}
                onMove={onMove}
                onRemove={onRemove}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default ClipsPanel
