function SettingsPanel({ themeMode, onTheme, textStyle, onTextStyle }) {
  return (
    <section className="card" id="settings">
      <div className="card-header">
        <div>
          <h2>Settings</h2>
          <p>Theme and caption defaults</p>
        </div>
      </div>

      <div className="theme-toggle">
        <label>
          <input
            type="radio"
            name="theme"
            value="light"
            checked={themeMode === 'light'}
            onChange={(event) => onTheme(event.target.value)}
          />
          Light
        </label>
        <label>
          <input
            type="radio"
            name="theme"
            value="dark"
            checked={themeMode === 'dark'}
            onChange={(event) => onTheme(event.target.value)}
          />
          Dark
        </label>
        <label>
          <input
            type="radio"
            name="theme"
            value="system"
            checked={themeMode === 'system'}
            onChange={(event) => onTheme(event.target.value)}
          />
          System
        </label>
      </div>

      <div className="field-grid">
        <div>
          <label>Caption position</label>
          <select
            className="select"
            value={textStyle.position}
            onChange={(event) =>
              onTextStyle({ ...textStyle, position: event.target.value })
            }
          >
            <option value="bottom-center">Bottom center</option>
            <option value="top-center">Top center</option>
            <option value="center">Center</option>
            <option value="top-left">Top left</option>
            <option value="top-right">Top right</option>
            <option value="bottom-left">Bottom left</option>
            <option value="bottom-right">Bottom right</option>
            <option value="custom">Custom (X/Y)</option>
          </select>
        </div>
        <div>
          <label>Caption color</label>
          <input
            className="input"
            type="text"
            value={textStyle.color}
            onChange={(event) =>
              onTextStyle({ ...textStyle, color: event.target.value })
            }
          />
        </div>
        <div>
          <label>Font size</label>
          <input
            className="input"
            type="number"
            min="12"
            value={textStyle.fontSize}
            onChange={(event) =>
              onTextStyle({
                ...textStyle,
                fontSize: Number(event.target.value) || 0,
              })
            }
          />
        </div>
        <div>
          <label>Shadow color</label>
          <input
            className="input"
            type="text"
            value={textStyle.shadowColor}
            onChange={(event) =>
              onTextStyle({ ...textStyle, shadowColor: event.target.value })
            }
          />
        </div>
        <div>
          <label>Margin</label>
          <input
            className="input"
            type="number"
            min="0"
            value={textStyle.margin}
            onChange={(event) =>
              onTextStyle({
                ...textStyle,
                margin: Number(event.target.value) || 0,
              })
            }
          />
        </div>
        <div>
          <label>Custom X</label>
          <input
            className="input"
            type="number"
            value={textStyle.x ?? 0}
            onChange={(event) =>
              onTextStyle({
                ...textStyle,
                x: Number(event.target.value) || 0,
              })
            }
          />
        </div>
        <div>
          <label>Custom Y</label>
          <input
            className="input"
            type="number"
            value={textStyle.y ?? 0}
            onChange={(event) =>
              onTextStyle({
                ...textStyle,
                y: Number(event.target.value) || 0,
              })
            }
          />
        </div>
      </div>
    </section>
  )
}

export default SettingsPanel
