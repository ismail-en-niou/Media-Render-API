function HeroCard({ busy, clipsCount, totalImageDuration, extendMode, onGenerate, onClear }) {
  return (
    <section className="card hero">
      <div>
        <p className="eyebrow">Upload &gt; Narrate &gt; Style &gt; Export</p>
        <h1>Turn your media into narrated stories.</h1>
        <p className="hero-copy">
          Keep upload order by default, apply smooth zooms, add captions,
          and export MP4 with ElevenLabs voiceover in one shot.
        </p>
        <div className="hero-actions">
          <button
            type="button"
            className="button primary"
            onClick={onGenerate}
            disabled={busy}
          >
            {busy ? 'Rendering...' : 'Generate Video'}
          </button>
          <button type="button" className="button ghost" onClick={onClear}>
            Clear all clips
          </button>
        </div>
      </div>
      <div className="hero-stats">
        <div>
          <p className="stat-label">Clips in queue</p>
          <p className="stat-value">{clipsCount}</p>
        </div>
        <div>
          <p className="stat-label">Image duration</p>
          <p className="stat-value">{totalImageDuration.toFixed(1)}s</p>
        </div>
        <div>
          <p className="stat-label">Extend mode</p>
          <p className="stat-value">{extendMode}</p>
        </div>
      </div>
    </section>
  )
}

export default HeroCard
