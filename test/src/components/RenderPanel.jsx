function RenderPanel({
  format,
  extendMode,
  defaultEffect,
  formatOptions,
  extendOptions,
  effectOptions,
  error,
  busy,
  onFormat,
  onExtend,
  onDefaultEffect,
  onGenerate,
}) {
  return (
    <section className="card" id="render">
      <div className="card-header">
        <div>
          <h2>Render setup</h2>
          <p>Choose format and how to extend visuals.</p>
        </div>
      </div>
      <div className="field-grid">
        <div>
          <label>Format</label>
          <select
            className="select"
            value={format}
            onChange={(event) => onFormat(event.target.value)}
          >
            {formatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Extend mode</label>
          <select
            className="select"
            value={extendMode}
            onChange={(event) => onExtend(event.target.value)}
          >
            {extendOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Default effect</label>
          <select
            className="select"
            value={defaultEffect}
            onChange={(event) => onDefaultEffect(event.target.value)}
          >
            {effectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="render-actions">
        <button
          type="button"
          className="button primary"
          onClick={onGenerate}
          disabled={busy}
        >
          {busy ? 'Rendering...' : 'Generate MP4'}
        </button>
        <p className="hint">Uses your upload order unless you move clips.</p>
      </div>
    </section>
  )
}

export default RenderPanel
