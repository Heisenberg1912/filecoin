import { useState, useCallback, useRef } from 'react'
import {
  uploadFile as uploadToFilecoin,
  getGatewayUrl,
  getExplorerUrl,
  isDemoMode,
  setDemoMode
} from '../lib/web3storage'
import { saveProof, getSavedProofs } from '../lib/proofStorage'
import { generateQRCode, downloadPDFCertificate, generateTwitterShareURL } from '../lib/proofUtils'
import './BatchUpload.css'

// SHA-256 hash function
async function hashFile(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format date
function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }).format(date)
}

function BatchUpload() {
  const [files, setFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, fileName: '' })
  const [results, setResults] = useState([])
  const [demoMode, setDemoModeState] = useState(true)
  const fileInputRef = useRef(null)

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles(prev => [...prev, ...newFiles].slice(0, 20)) // Max 20 files
    }
  }, [])

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles].slice(0, 20))
    }
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const processAllFiles = async () => {
    if (files.length === 0) return

    setDemoMode(demoMode)
    setProcessing(true)
    setProgress({ current: 0, total: files.length, fileName: '' })
    setResults([])

    const newResults = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress({ current: i + 1, total: files.length, fileName: file.name })

      try {
        const fileHash = await hashFile(file)
        const cid = await uploadToFilecoin(file)
        const timestamp = new Date()

        const proofData = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          sha256Hash: fileHash,
          cid: cid,
          timestamp: timestamp.toISOString(),
          timestampReadable: formatDate(timestamp),
          unixTimestamp: Math.floor(timestamp.getTime() / 1000),
          gatewayUrl: getGatewayUrl(cid),
          explorerUrl: getExplorerUrl(cid),
          proofId: `PV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          demoMode: demoMode
        }

        saveProof(proofData)
        newResults.push({ success: true, proof: proofData })
      } catch (err) {
        newResults.push({ success: false, fileName: file.name, error: err.message })
      }
    }

    setResults(newResults)
    setProcessing(false)
    setFiles([])
  }

  const downloadAllJSON = () => {
    const successfulProofs = results.filter(r => r.success).map(r => r.proof)
    if (successfulProofs.length === 0) return

    const blob = new Blob([JSON.stringify(successfulProofs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proofvault-batch-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setFiles([])
    setResults([])
    setProgress({ current: 0, total: 0, fileName: '' })
  }

  const totalSize = files.reduce((acc, f) => acc + f.size, 0)
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  return (
    <div className="batch-upload">
      <div className="container">
        <section className="batch-hero animate-slideUp">
          <div className="hero-badge">
            <span className="badge-dot" />
            Batch Processing
          </div>
          <h1 className="hero-title">
            Batch File<br />
            <span className="gradient-text">Certification</span>
          </h1>
          <p className="hero-subtitle">
            Upload multiple files at once and generate proof certificates for all of them.
            Perfect for bulk document certification.
          </p>
        </section>

        <div className="batch-card animate-fadeIn">
          {results.length === 0 ? (
            <>
              {/* Mode Toggle */}
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${demoMode ? 'active' : ''}`}
                  onClick={() => setDemoModeState(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Demo Mode
                </button>
                <button
                  className={`mode-btn ${!demoMode ? 'active' : ''}`}
                  onClick={() => setDemoModeState(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 12H16M8 8H16M8 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Filecoin
                </button>
              </div>

              {/* Drop Zone */}
              <div
                className={`drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />
                <div className="drop-content">
                  <div className="drop-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="url(#batchGradient)" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M17 8L12 3L7 8" stroke="url(#batchGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 3V15" stroke="url(#batchGradient)" strokeWidth="2" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="batchGradient" x1="3" y1="3" x2="21" y2="21">
                          <stop stopColor="#00ff88"/>
                          <stop offset="1" stopColor="#00cc6a"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <p className="drop-text">
                    <strong>Drop multiple files here</strong>
                    <span>or click to browse</span>
                  </p>
                  <span className="drop-hint">Select up to 20 files at once</span>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="file-list">
                  <div className="file-list-header">
                    <h4>{files.length} file{files.length !== 1 ? 's' : ''} selected</h4>
                    <span className="total-size">{formatFileSize(totalSize)}</span>
                  </div>
                  <div className="file-items">
                    {files.map((file, index) => (
                      <div key={index} className="file-item">
                        <div className="file-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                        <div className="file-details">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">{formatFileSize(file.size)}</span>
                        </div>
                        <button className="file-remove" onClick={() => removeFile(index)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress */}
              {processing && (
                <div className="progress-section">
                  <div className="progress-info">
                    <span>Processing: {progress.fileName}</span>
                    <span>{progress.current} / {progress.total}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="batch-actions">
                <button
                  className="btn btn-primary"
                  onClick={processAllFiles}
                  disabled={files.length === 0 || processing}
                >
                  {processing ? (
                    <>
                      <span className="spinner" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Generate {files.length} Proof{files.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
                {files.length > 0 && (
                  <button className="btn btn-ghost" onClick={() => setFiles([])}>
                    Clear All
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Results Display */
            <div className="results-display">
              <div className="results-header">
                <div className="results-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <h3>Batch Processing Complete</h3>
                  <p>{successCount} successful, {failCount} failed</p>
                </div>
              </div>

              <div className="results-list">
                {results.map((result, index) => (
                  <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                    <div className="result-status">
                      {result.success ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                    <div className="result-info">
                      <span className="result-name">{result.success ? result.proof.fileName : result.fileName}</span>
                      <span className="result-detail">
                        {result.success ? result.proof.proofId : result.error}
                      </span>
                    </div>
                    {result.success && (
                      <div className="result-actions">
                        <button
                          className="icon-btn"
                          onClick={() => downloadPDFCertificate(result.proof)}
                          title="Download PDF"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="results-actions">
                <button className="btn btn-primary" onClick={downloadAllJSON}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Download All (JSON)
                </button>
                <button className="btn btn-secondary" onClick={reset}>
                  Process More Files
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <section className="batch-features">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4>Fast Processing</h4>
            <p>Process multiple files in parallel with optimized upload pipelines.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h4>Bulk Export</h4>
            <p>Download all proof certificates at once in JSON or PDF format.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 9H21" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 21V9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h4>Organized Results</h4>
            <p>Track success and failure status for each file in your batch.</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default BatchUpload
