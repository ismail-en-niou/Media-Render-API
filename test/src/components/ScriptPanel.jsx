function ScriptPanel({ script, onChange }) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Voiceover script</h2>
          <p>ElevenLabs will narrate this text.</p>
        </div>
      </div>
      <textarea
        className="textarea"
        rows="5"
        value={script}
        onChange={onChange}
        placeholder="Type the story you want narrated..."
      />
    </section>
  )
}

export default ScriptPanel
