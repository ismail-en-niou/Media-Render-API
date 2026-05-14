function Topbar() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-icon">MR</div>
        <div>
          <p className="brand-title">Media Render Studio</p>
          <p className="brand-subtitle">Voice-driven video pipeline</p>
        </div>
      </div>
      <nav className="nav">
        <a className="active" href="#pipeline">Pipeline</a>
        <a href="#assets">Assets</a>
        <a href="#render">Renders</a>
        <a href="#settings">Settings</a>
      </nav>
      <div className="top-actions">
        <div className="search">
          <span>Search</span>
          <input
            type="search"
            placeholder="Find clips, renders, logs"
            aria-label="Search"
          />
        </div>
        <button type="button" className="profile">
          <span className="avatar">IN</span>
          <span className="profile-label">Ismail</span>
          <span className="caret">v</span>
        </button>
      </div>
    </header>
  )
}

export default Topbar
