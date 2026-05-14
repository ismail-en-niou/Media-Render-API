function UploadPanel({ onFiles }) {
  return (
    <section className="card" id="assets">
      <div className="card-header">
        <div>
          <h2>Upload assets</h2>
          <p>Clips follow upload order. Reorder anytime.</p>
        </div>
        <label className="button secondary" htmlFor="file-input">
          Add files
        </label>
        <input
          id="file-input"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={onFiles}
        />
      </div>
      <div className="upload-hint">
        <span>Accepted:</span>
        <span>JPG, PNG, WEBP, GIF, MP4, MOV, WEBM</span>
      </div>
    </section>
  )
}

export default UploadPanel
