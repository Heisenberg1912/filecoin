import { useState } from 'react'
import './URLImport.css'

function URLImport({ onFileLoaded, disabled }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      setError('Invalid URL format')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch the file from URL
      const response = await fetch(url, {
        mode: 'cors'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
      }

      // Get content type and filename
      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      const contentDisposition = response.headers.get('content-disposition')
      let fileName = 'downloaded-file'

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/i)
        if (match) {
          fileName = match[1]
        }
      } else {
        // Extract filename from URL
        const urlPath = new URL(url).pathname
        const urlFileName = urlPath.split('/').pop()
        if (urlFileName && urlFileName.includes('.')) {
          fileName = urlFileName
        }
      }

      // Get the blob
      const blob = await response.blob()

      // Create a File object
      const file = new File([blob], fileName, { type: contentType })

      // Pass to parent
      onFileLoaded(file, url)

      // Clear input
      setUrl('')
      setExpanded(false)
    } catch (err) {
      console.error('URL import error:', err)

      if (err.message.includes('CORS') || err.message.includes('NetworkError')) {
        setError('Cannot fetch due to CORS restrictions. Try a direct download link.')
      } else {
        setError(err.message || 'Failed to fetch file from URL')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !disabled && !loading) {
      handleImport()
    }
  }

  // Cloud storage icons for quick access
  const cloudServices = [
    {
      name: 'Google Drive',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path d="M8 6L12 12L8 18H16L20 12L16 6H8Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 18L8 12L12 18H4Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 6L16 12L12 18" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
      hint: 'Use sharing link with "Anyone with the link"'
    },
    {
      name: 'Dropbox',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path d="M12 6L6 10L12 14L6 18L12 14L18 18L12 14L18 10L12 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      ),
      hint: 'Change ?dl=0 to ?dl=1 in Dropbox links'
    },
    {
      name: 'Direct Link',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      hint: 'Any direct file download URL'
    }
  ]

  if (!expanded) {
    return (
      <button
        className="url-import-trigger"
        onClick={() => setExpanded(true)}
        disabled={disabled}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Import from URL
      </button>
    )
  }

  return (
    <div className="url-import">
      <div className="url-import-header">
        <h4>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Import from URL
        </h4>
        <button className="close-btn" onClick={() => setExpanded(false)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="url-input-group">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com/file.pdf"
          disabled={disabled || loading}
        />
        <button
          className="import-btn"
          onClick={handleImport}
          disabled={disabled || loading || !url.trim()}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Fetching...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Import
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="url-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      <div className="cloud-services">
        {cloudServices.map((service) => (
          <div key={service.name} className="cloud-service-hint" title={service.hint}>
            {service.icon}
            <span>{service.name}</span>
          </div>
        ))}
      </div>

      <p className="url-hint">
        Paste a direct link to any file. Works with public cloud storage links.
      </p>
    </div>
  )
}

export default URLImport
