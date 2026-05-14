function PreviewPanel({ result, resolveUrl }) {
  return (
    <section className="card preview">
      <div className="card-header">
        <div>
          <h2>Preview</h2>
          <p>Rendered output</p>
        </div>
      </div>
      {result ? (
        <div className="preview-body">
          <video src={resolveUrl(result.outputUrl)} controls />
          <audio src={resolveUrl(result.audioUrl)} controls />
          <div className="preview-links">
            <a
              className="button primary"
              href={resolveUrl(result.outputUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Download video
            </a>
            <a
              className="button ghost"
              href={resolveUrl(result.audioUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Download audio
            </a>
          </div>
          {result.warnings && result.warnings.length > 0 ? (
            <div className="warning">
              {result.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="empty-state">
          <p>No render yet. Generate a video to preview.</p>
        </div>
      )}
    </section>
  )
}

export default PreviewPanel
