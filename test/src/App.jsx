import { useEffect, useMemo, useState } from 'react'
import ActivityPanel from './components/ActivityPanel.jsx'
import ClipsPanel from './components/ClipsPanel.jsx'
import HeroCard from './components/HeroCard.jsx'
import PreviewPanel from './components/PreviewPanel.jsx'
import RenderPanel from './components/RenderPanel.jsx'
import ScriptPanel from './components/ScriptPanel.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import Topbar from './components/Topbar.jsx'
import UploadPanel from './components/UploadPanel.jsx'
import UploadLibraryPanel from './components/UploadLibraryPanel.jsx'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const EFFECT_OPTIONS = [
  { value: 'zoom-in', label: 'Zoom in' },
  { value: 'zoom-out', label: 'Zoom out' },
  { value: 'none', label: 'None' },
]

const FORMAT_OPTIONS = [
  { value: '16:9', label: '16:9 Landscape' },
  { value: '9:16', label: '9:16 Portrait' },
  { value: '1:1', label: '1:1 Square' },
]

const EXTEND_OPTIONS = [
  { value: 'loop', label: 'Loop visuals' },
  { value: 'stretch', label: 'Stretch image durations' },
  { value: 'none', label: 'No extension' },
]

const DEFAULT_TEXT_STYLE = {
  position: 'bottom-center',
  color: 'white',
  fontSize: 44,
  shadowColor: 'black',
  shadowX: 2,
  shadowY: 2,
  margin: 48,
  x: 0,
  y: 0,
  fontFile: '',
}

const resolveUrl = (path) => {
  if (!path) {
    return ''
  }
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  const base = API_BASE.replace(/\/$/, '')
  return `${base}${path}`
}

const getClipType = (file) => {
  if (!file) {
    return 'image'
  }
  if (file.type && file.type.startsWith('video/')) {
    return 'video'
  }
  if (file.type && file.type.startsWith('image/')) {
    return 'image'
  }
  const ext = file.name?.toLowerCase().split('.').pop()
  if (['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv'].includes(ext)) {
    return 'video'
  }
  return 'image'
}

const cleanObject = (input) => {
  const output = {}
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }
    output[key] = value
  })
  return output
}

const parseResponseBody = async (response) => {
  const text = await response.text()
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch (err) {
    return { message: text }
  }
}

function App() {
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem('themeMode') || 'system'
  )
  const [script, setScript] = useState('')
  const [clips, setClips] = useState([])
  const [format, setFormat] = useState('16:9')
  const [extendMode, setExtendMode] = useState('loop')
  const [defaultEffect, setDefaultEffect] = useState('zoom-in')
  const [textStyle, setTextStyle] = useState(DEFAULT_TEXT_STYLE)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [activity, setActivity] = useState([])
  const [uploads, setUploads] = useState([])
  const [uploadsLoading, setUploadsLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode)
    const mediaQuery = window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null
    const applyTheme = () => {
      const resolved =
        themeMode === 'system'
          ? mediaQuery && mediaQuery.matches
            ? 'dark'
            : 'light'
          : themeMode
      document.documentElement.setAttribute('data-theme', resolved)
    }
    applyTheme()
    if (!mediaQuery) {
      return undefined
    }
    mediaQuery.addEventListener('change', applyTheme)
    return () => mediaQuery.removeEventListener('change', applyTheme)
  }, [themeMode])

  const totalImageDuration = useMemo(() => {
    return clips.reduce((sum, clip) => {
      if (clip.type === 'image') {
        return sum + (Number(clip.duration) || 0)
      }
      return sum
    }, 0)
  }, [clips])

  const addLog = (message) => {
    setActivity((prev) => [
      { id: createId(), message, time: new Date().toLocaleTimeString() },
      ...prev,
    ])
  }

  const fetchUploads = async () => {
    setUploadsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/uploads`)
      const data = await parseResponseBody(response)
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to load uploads')
      }
      setUploads(data.files || [])
    } catch (err) {
      addLog(`Uploads error: ${err.message || 'Failed to load uploads'}`)
    } finally {
      setUploadsLoading(false)
    }
  }

  const handleInsertUpload = (file) => {
    const type = file.type === 'video' ? 'video' : 'image'
    const clip = {
      id: createId(),
      file: null,
      preview: resolveUrl(file.url),
      src: file.url,
      name: file.name,
      type,
      duration: type === 'image' ? 4 : '',
      effect: defaultEffect,
      text: '',
      textStart: '',
      textEnd: '',
    }
    setClips((prev) => [...prev, clip])
    addLog(`Inserted ${file.name} into clips`)
  }

  const handleDeleteUpload = async (name) => {
    try {
      const response = await fetch(`${API_BASE}/api/uploads/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      })
      const data = await parseResponseBody(response)
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Delete failed')
      }
      addLog(`Deleted ${name}`)
      fetchUploads()
    } catch (err) {
      addLog(`Delete error: ${err.message || 'Delete failed'}`)
    }
  }

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || [])
    if (selected.length === 0) {
      return
    }
    const next = selected.map((file) => {
      const type = getClipType(file)
      return {
        id: createId(),
        file,
        name: file.name,
        type,
        duration: type === 'image' ? 4 : '',
        effect: 'zoom-in',
        text: '',
        textStart: '',
        textEnd: '',
      }
    })
    setClips((prev) => [...prev, ...next])
    event.target.value = ''
  }

  const updateClip = (id, patch) => {
    setClips((prev) =>
      prev.map((clip) => (clip.id === id ? { ...clip, ...patch } : clip))
    )
  }

  const moveClip = (index, delta) => {
    setClips((prev) => {
      const next = [...prev]
      const targetIndex = index + delta
      if (targetIndex < 0 || targetIndex >= next.length) {
        return prev
      }
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
  }

  const removeClip = (id) => {
    setClips((prev) => prev.filter((clip) => clip.id !== id))
  }

  const clearClips = () => {
    setClips([])
  }

  const handleGenerate = async () => {
    setError('')
    if (!script.trim()) {
      setError('Add a voiceover script before rendering.')
      return
    }
    if (clips.length === 0) {
      setError('Upload at least one image or video clip.')
      return
    }

    const formData = new FormData()
    formData.append('text', script.trim())
    formData.append('format', format)
    formData.append('extendMode', extendMode)
    formData.append('defaultEffect', defaultEffect)
    formData.append('textStyle', JSON.stringify(textStyle))

    const clipsPayload = clips.map((clip) => {
      const textOverlay = clip.text
        ? cleanObject({
            value: clip.text,
            start: clip.textStart ? Number(clip.textStart) : undefined,
            end: clip.textEnd ? Number(clip.textEnd) : undefined,
          })
        : undefined

      return cleanObject({
        src: clip.src,
        effect: clip.effect,
        duration: clip.type === 'image' ? Number(clip.duration) || undefined : undefined,
        text: textOverlay,
      })
    })

    formData.append('clips', JSON.stringify(clipsPayload))
    clips.forEach((clip) => {
      if (clip.file) {
        formData.append('files', clip.file)
      }
    })

    setBusy(true)
    addLog('Starting render with ElevenLabs voiceover...')
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/api/video/generate`, {
        method: 'POST',
        body: formData,
      })
      const data = await parseResponseBody(response)
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Video render failed')
      }
      setResult(data)
      addLog('Render completed. Video is ready to download.')
      fetchUploads()
    } catch (err) {
      setError(err.message || 'Something went wrong')
      addLog(`Error: ${err.message || 'Render failed'}`)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    fetchUploads()
  }, [])

  return (
    <div className="page">
      <Topbar />

      <main className="content" id="pipeline">
        <HeroCard
          busy={busy}
          clipsCount={clips.length}
          totalImageDuration={totalImageDuration}
          extendMode={extendMode}
          onGenerate={handleGenerate}
          onClear={clearClips}
        />

        <div className="grid">
          <section className="column main">
            <UploadPanel onFiles={handleFiles} />
            <ScriptPanel
              script={script}
              onChange={(event) => setScript(event.target.value)}
            />
            <UploadLibraryPanel
              files={uploads}
              loading={uploadsLoading}
              onRefresh={fetchUploads}
              onDelete={handleDeleteUpload}
              onInsert={handleInsertUpload}
              resolveUrl={resolveUrl}
            />
            <ClipsPanel
              clips={clips}
              effectOptions={EFFECT_OPTIONS}
              onMove={moveClip}
              onRemove={removeClip}
              onUpdate={updateClip}
            />
            <RenderPanel
              format={format}
              extendMode={extendMode}
              defaultEffect={defaultEffect}
              formatOptions={FORMAT_OPTIONS}
              extendOptions={EXTEND_OPTIONS}
              effectOptions={EFFECT_OPTIONS}
              error={error}
              busy={busy}
              onFormat={setFormat}
              onExtend={setExtendMode}
              onDefaultEffect={setDefaultEffect}
              onGenerate={handleGenerate}
            />
          </section>

          <aside className="column side">
            <SettingsPanel
              themeMode={themeMode}
              onTheme={setThemeMode}
              textStyle={textStyle}
              onTextStyle={setTextStyle}
            />
            <PreviewPanel result={result} resolveUrl={resolveUrl} />
            <ActivityPanel activity={activity} />
          </aside>
        </div>
      </main>
    </div>
  )
}

export default App
