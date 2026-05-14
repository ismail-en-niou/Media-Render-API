function ActivityPanel({ activity }) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Activity</h2>
          <p>Latest pipeline events</p>
        </div>
      </div>
      <div className="activity">
        {activity.length === 0 ? (
          <p className="empty-state">No activity yet.</p>
        ) : (
          activity.map((item) => (
            <div key={item.id} className="activity-item">
              <span>{item.time}</span>
              <p>{item.message}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default ActivityPanel
