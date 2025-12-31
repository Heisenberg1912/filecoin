import { useState, useCallback, useRef, useEffect } from 'react'
import { getGatewayUrl } from '../lib/web3storage'
import { getSavedProofs, saveProof, deleteProof } from '../lib/proofStorage'
import './Verify.css'

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Hash file
async function hashFile(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Hash buffer
async function hashBuffer(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function Verify() {
  const [parsedProof, setParsedProof] = useState(null)
  const [proofJson, setProofJson] = useState('')
  const [verifyError, setVerifyError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [copied, setCopied] = useState(null)
  const fileInputRef = useRef(null)

  // Verification states
  const [verifying, setVerifying] = useState(false)
  const [hashMatch, setHashMatch] = useState(null)
  const [autoVerifying, setAutoVerifying] = useState(false)
  const [autoVerifyResult, setAutoVerifyResult] = useState(null)

  // Saved proofs
  const [savedProofs, setSavedProofs] = useState([])
  const [showSavedProofs, setShowSavedProofs] = useState(false)

  // Download state
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    setSavedProofs(getSavedProofs())
  }, [])

  const handleProofInput = (value) => {
    setProofJson(value)
    setVerifyError(null)
    setParsedProof(null)
    setHashMatch(null)
    setAutoVerifyResult(null)

    if (!value.trim()) return

    try {
      const proof = JSON.parse(value)
      if (!proof.sha256Hash || !proof.cid || !proof.proofId) {
        throw new Error('Invalid proof format')
      }
      setParsedProof(proof)
    } catch (err) {
      setVerifyError('Invalid JSON format or missing required fields')
    }
  }

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader()
        reader.onload = (event) => handleProofInput(event.target.result)
        reader.readAsText(file)
      } else {
        setVerifyError('Please upload a JSON file')
      }
    }
  }, [])

  const handleProofFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => handleProofInput(event.target.result)
      reader.readAsText(file)
    }
  }

  const handleVerifyFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !parsedProof) return

    setVerifying(true)
    setHashMatch(null)
    setAutoVerifyResult(null)

    try {
      const hash = await hashFile(file)
      setHashMatch(hash === parsedProof.sha256Hash)
    } catch (err) {
      setHashMatch(false)
    } finally {
      setVerifying(false)
    }
  }

  const handleAutoVerify = async () => {
    if (!parsedProof || parsedProof.demoMode) return

    setAutoVerifying(true)
    setAutoVerifyResult(null)
    setHashMatch(null)

    try {
      const url = getGatewayUrl(parsedProof.cid)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('File not found on IPFS')
      }

      const buffer = await response.arrayBuffer()
      const fetchedHash = await hashBuffer(buffer)
      const isMatch = fetchedHash === parsedProof.sha256Hash

      setAutoVerifyResult({
        success: true,
        match: isMatch,
        fetchedHash,
        fileSize: buffer.byteLength
      })
    } catch (err) {
      setAutoVerifyResult({
        success: false,
        error: err.message || 'Failed to fetch from IPFS'
      })
    } finally {
      setAutoVerifying(false)
    }
  }

  const handleDownloadFile = async () => {
    if (!parsedProof || parsedProof.demoMode) return

    setDownloading(true)

    try {
      const url = getGatewayUrl(parsedProof.cid)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('File not found on IPFS')
      }

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = parsedProof.fileName || 'downloaded-file'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      alert('Failed to download: ' + (err.message || 'Unknown error'))
    } finally {
      setDownloading(false)
    }
  }

  const loadSavedProof = (proof) => {
    setParsedProof(proof)
    setProofJson(JSON.stringify(proof, null, 2))
    setShowSavedProofs(false)
    setHashMatch(null)
    setAutoVerifyResult(null)
  }

  const handleDeleteProof = (proofId, e) => {
    e.stopPropagation()
    deleteProof(proofId)
    setSavedProofs(getSavedProofs())
  }

  const handleSaveProof = () => {
    if (!parsedProof) return
    saveProof(parsedProof)
    setSavedProofs(getSavedProofs())
    setCopied('saved')
    setTimeout(() => setCopied(null), 2000)
  }

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const reset = () => {
    setProofJson('')
    setParsedProof(null)
    setVerifyError(null)
    setHashMatch(null)
    setAutoVerifyResult(null)
  }

  return (
    <div className="verify-page">
      <div className="container">
        {/* Hero */}
        <section className="verify-hero animate-slideUp">
          <h1 className="verify-title">
            Verify <span className="gradient-text">Proof</span>
          </h1>
          <p className="verify-subtitle">
            Upload a proof certificate to verify file authenticity and check if it matches the original.
          </p>
        </section>

        {/* Main Card */}
        <div className="verify-card animate-fadeIn">
          {!parsedProof ? (
            <>
              {/* Saved Proofs */}
              {savedProofs.length > 0 && (
                <div className="saved-section">
                  <button
                    className="saved-toggle"
                    onClick={() => setShowSavedProofs(!showSavedProofs)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Saved Proofs ({savedProofs.length})
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto', transform: showSavedProofs ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {showSavedProofs && (
                    <div className="saved-list">
                      {savedProofs.map((proof) => (
                        <div
                          key={proof.proofId}
                          className="saved-item"
                          onClick={() => loadSavedProof(proof)}
                        >
                          <div className="saved-info">
                            <span className="saved-name">{proof.fileName}</span>
                            <span className="saved-meta">
                              {formatFileSize(proof.fileSize)} • {new Date(proof.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            className="delete-btn"
                            onClick={(e) => handleDeleteProof(proof.proofId, e)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M3 6H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Drop Zone */}
              <div
                className={`verify-drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleProofFileChange}
                  style={{ display: 'none' }}
                />
                <div className="drop-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="url(#verifyGrad)" strokeWidth="2"/>
                    <path d="M14 2V8H20" stroke="url(#verifyGrad)" strokeWidth="2"/>
                    <defs>
                      <linearGradient id="verifyGrad" x1="4" y1="2" x2="20" y2="22">
                        <stop stopColor="#6366f1"/>
                        <stop offset="1" stopColor="#a855f7"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <p className="drop-text">
                  <strong>Drop proof JSON here</strong>
                  <span>or click to browse</span>
                </p>
              </div>

              <div className="divider">
                <span>or paste JSON</span>
              </div>

              <textarea
                value={proofJson}
                onChange={(e) => handleProofInput(e.target.value)}
                placeholder='{"proofId": "PV-...", "sha256Hash": "...", "cid": "..."}'
                rows={5}
              />

              {verifyError && (
                <div className="error-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {verifyError}
                </div>
              )}
            </>
          ) : (
            /* Proof Loaded */
            <div className="proof-loaded">
              <div className="proof-header">
                <div className="proof-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <h3>Valid Certificate</h3>
                  <p className="proof-id">{parsedProof.proofId}</p>
                </div>
                {parsedProof.demoMode && <span className="demo-tag">Demo</span>}
              </div>

              <div className="proof-info">
                <div className="info-row">
                  <span className="info-label">File</span>
                  <span className="info-value">{parsedProof.fileName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Size</span>
                  <span className="info-value">{formatFileSize(parsedProof.fileSize)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Timestamp</span>
                  <span className="info-value">{parsedProof.timestampReadable || parsedProof.timestamp}</span>
                </div>
                <div className="info-row-full">
                  <span className="info-label">SHA-256 Hash</span>
                  <div className="hash-box">
                    <code>{parsedProof.sha256Hash}</code>
                    <button onClick={() => copyToClipboard(parsedProof.sha256Hash, 'hash')}>
                      {copied === 'hash' ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="info-row-full">
                  <span className="info-label">IPFS CID</span>
                  <div className="hash-box">
                    <code>{parsedProof.cid}</code>
                    <button onClick={() => copyToClipboard(parsedProof.cid, 'cid')}>
                      {copied === 'cid' ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Download Section */}
              {!parsedProof.demoMode && (
                <div className="download-section">
                  <button
                    className="btn btn-primary download-btn"
                    onClick={handleDownloadFile}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <span className="spinner" />
                        Downloading from Filecoin...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Download Original File
                      </>
                    )}
                  </button>
                  <p className="download-hint">Download the original file from the Filecoin network</p>
                </div>
              )}

              {/* Verification Section */}
              <div className="verify-section">
                <h4>Verify Authenticity</h4>

                {!parsedProof.demoMode && (
                  <>
                    <p className="verify-desc">Fetch from IPFS and verify hash automatically</p>
                    <button
                      className="btn btn-primary verify-btn"
                      onClick={handleAutoVerify}
                      disabled={autoVerifying}
                    >
                      {autoVerifying ? (
                        <>
                          <span className="spinner" />
                          Fetching & Verifying...
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          One-Click Verify
                        </>
                      )}
                    </button>

                    {autoVerifyResult && (
                      <div className={`result-box ${autoVerifyResult.success && autoVerifyResult.match ? 'success' : 'error'}`}>
                        {autoVerifyResult.success ? (
                          autoVerifyResult.match ? (
                            <>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <div>
                                <strong>Verified!</strong>
                                <span>File on IPFS matches certificate hash</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              <div>
                                <strong>Mismatch!</strong>
                                <span>Hash does not match</span>
                              </div>
                            </>
                          )
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <div>{autoVerifyResult.error}</div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="or-divider">
                      <span>or</span>
                    </div>
                  </>
                )}

                {parsedProof.demoMode && (
                  <div className="demo-notice">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Demo proof - file not stored on IPFS
                  </div>
                )}

                <p className="verify-desc-small">Upload local file to verify hash</p>
                <label className="file-upload-btn">
                  <input
                    type="file"
                    onChange={handleVerifyFileChange}
                    style={{ display: 'none' }}
                  />
                  {verifying ? (
                    <>
                      <span className="spinner" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Select File
                    </>
                  )}
                </label>

                {hashMatch !== null && (
                  <div className={`result-box ${hashMatch ? 'success' : 'error'}`}>
                    {hashMatch ? (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <strong>Hash matches! File is authentic.</strong>
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <strong>Hash mismatch. File may have been modified.</strong>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="proof-actions">
                <button className="btn btn-secondary" onClick={handleSaveProof}>
                  {copied === 'saved' ? 'Saved!' : 'Save to Browser'}
                </button>
                <button className="btn btn-ghost" onClick={reset}>
                  Verify Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Verify
