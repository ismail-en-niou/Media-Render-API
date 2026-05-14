function UploadLibraryPanel({ files, loading, onRefresh, onDelete, resolveUrl }) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Uploaded library</h2>
          <p>Browse what is already stored on the server.</p>
        </div>
        <button type="button" className="button ghost" onClick={onRefresh}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <p>No uploads yet. Add files to see them here.</p>
        </div>
      ) : (
        <div className="library-grid">
          {files.map((file) => (
            <div key={file.name} className="library-card">
              <div className="library-preview">
                {file.type === 'video' ? (
                  <video src={resolveUrl(file.url)} controls />
                ) : (
                  <img src={resolveUrl(file.url)} alt={file.name} />
                )}
              </div>
              <div className="library-meta">
                <p className="library-name">{file.name}</p>
                <p className="library-sub">
                  {file.type} · {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="library-actions">
                <a
                  className="button ghost"
                  href={resolveUrl(file.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
                <button
                  type="button"
                  className="button danger"
                  onClick={() => onDelete(file.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default UploadLibraryPanel
