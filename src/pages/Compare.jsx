import { useState, useRef } from 'react'
import { compareProofs } from '../lib/proofUtils'
import './Compare.css'

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds} seconds`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`
  return `${Math.floor(seconds / 86400)} days`
}

function Compare() {
  const [proof1, setProof1] = useState(null)
  const [proof2, setProof2] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [error, setError] = useState(null)
  const fileInput1Ref = useRef(null)
  const fileInput2Ref = useRef(null)

  const handleFileUpload = async (file, setProof) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.sha256Hash || !data.cid || !data.proofId) {
        throw new Error('Invalid proof format')
      }
      setProof(data)
      setError(null)
    } catch (err) {
      setError('Invalid proof file. Please upload a valid ProofVault JSON certificate.')
    }
  }

  const handlePaste = (text, setProof) => {
    try {
      const data = JSON.parse(text)
      if (!data.sha256Hash || !data.cid || !data.proofId) {
        throw new Error('Invalid proof format')
      }
      setProof(data)
      setError(null)
    } catch {
      setError('Invalid JSON format')
    }
  }

  const runComparison = () => {
    if (!proof1 || !proof2) return
    const result = compareProofs(proof1, proof2)
    setComparison(result)
  }

  const reset = () => {
    setProof1(null)
    setProof2(null)
    setComparison(null)
    setError(null)
  }

  return (
    <div className="compare">
      <div className="container">
        <section className="compare-hero animate-slideUp">
          <div className="hero-badge">
            <span className="badge-dot" />
            Comparison Tool
          </div>
          <h1 className="hero-title">
            Compare<br />
            <span className="gradient-text">Proofs</span>
          </h1>
          <p className="hero-subtitle">
            Compare two proof certificates to verify if they reference the same file
            or check for tampering.
          </p>
        </section>

        {!comparison ? (
          <div className="compare-inputs animate-fadeIn">
            {/* Proof 1 Input */}
            <div className="proof-input-card">
              <div className="input-header">
                <div className="input-number">1</div>
                <h3>First Proof</h3>
              </div>

              {proof1 ? (
                <div className="proof-preview">
                  <div className="preview-header">
                    <div className="preview-icon success">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <span className="preview-status">Loaded</span>
                    <button className="clear-btn" onClick={() => setProof1(null)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="preview-details">
                    <div className="preview-row">
                      <span>File</span>
                      <strong>{proof1.fileName}</strong>
                    </div>
                    <div className="preview-row">
                      <span>Proof ID</span>
                      <code>{proof1.proofId}</code>
                    </div>
                    <div className="preview-row">
                      <span>Date</span>
                      <span>{new Date(proof1.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="input-area">
                  <input
                    ref={fileInput1Ref}
                    type="file"
                    accept=".json"
                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], setProof1)}
                    style={{ display: 'none' }}
                  />
                  <button
                    className="upload-btn"
                    onClick={() => fileInput1Ref.current?.click()}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Upload Proof JSON
                  </button>
                  <div className="divider">
                    <span>or paste JSON</span>
                  </div>
                  <textarea
                    placeholder='{"proofId": "...", "sha256Hash": "...", ...}'
                    onPaste={(e) => {
                      e.preventDefault()
                      handlePaste(e.clipboardData.getData('text'), setProof1)
                    }}
                  />
                </div>
              )}
            </div>

            {/* VS Divider */}
            <div className="vs-divider">
              <span>VS</span>
            </div>

            {/* Proof 2 Input */}
            <div className="proof-input-card">
              <div className="input-header">
                <div className="input-number">2</div>
                <h3>Second Proof</h3>
              </div>

              {proof2 ? (
                <div className="proof-preview">
                  <div className="preview-header">
                    <div className="preview-icon success">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <span className="preview-status">Loaded</span>
                    <button className="clear-btn" onClick={() => setProof2(null)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="preview-details">
                    <div className="preview-row">
                      <span>File</span>
                      <strong>{proof2.fileName}</strong>
                    </div>
                    <div className="preview-row">
                      <span>Proof ID</span>
                      <code>{proof2.proofId}</code>
                    </div>
                    <div className="preview-row">
                      <span>Date</span>
                      <span>{new Date(proof2.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="input-area">
                  <input
                    ref={fileInput2Ref}
                    type="file"
                    accept=".json"
                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], setProof2)}
                    style={{ display: 'none' }}
                  />
                  <button
                    className="upload-btn"
                    onClick={() => fileInput2Ref.current?.click()}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Upload Proof JSON
                  </button>
                  <div className="divider">
                    <span>or paste JSON</span>
                  </div>
                  <textarea
                    placeholder='{"proofId": "...", "sha256Hash": "...", ...}'
                    onPaste={(e) => {
                      e.preventDefault()
                      handlePaste(e.clipboardData.getData('text'), setProof2)
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Comparison Results */
          <div className="comparison-results animate-fadeIn">
            <div className={`results-header ${comparison.sameFile ? 'match' : 'different'}`}>
              <div className="results-icon">
                {comparison.sameFile ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <div className="results-title">
                <h3>{comparison.sameFile ? 'Files Match!' : 'Files Are Different'}</h3>
                <p>{comparison.sameFile
                  ? 'Both proofs reference the exact same file content.'
                  : 'The file hashes do not match - these are different files.'
                }</p>
              </div>
            </div>

            <div className="comparison-table">
              <div className="table-header">
                <span>Attribute</span>
                <span>Proof 1</span>
                <span>Proof 2</span>
                <span>Match</span>
              </div>

              <div className="table-row">
                <span className="attr-name">File Name</span>
                <span className="attr-value">{proof1.fileName}</span>
                <span className="attr-value">{proof2.fileName}</span>
                <span className={`attr-match ${comparison.sameFileName ? 'yes' : 'no'}`}>
                  {comparison.sameFileName ? '✓' : '✗'}
                </span>
              </div>

              <div className="table-row">
                <span className="attr-name">File Size</span>
                <span className="attr-value">{formatFileSize(proof1.fileSize)}</span>
                <span className="attr-value">{formatFileSize(proof2.fileSize)}</span>
                <span className={`attr-match ${comparison.sameSize ? 'yes' : 'no'}`}>
                  {comparison.sameSize ? '✓' : '✗'}
                </span>
              </div>

              <div className="table-row highlight">
                <span className="attr-name">SHA-256 Hash</span>
                <span className="attr-value mono">{proof1.sha256Hash.substring(0, 20)}...</span>
                <span className="attr-value mono">{proof2.sha256Hash.substring(0, 20)}...</span>
                <span className={`attr-match ${comparison.sameFile ? 'yes' : 'no'}`}>
                  {comparison.sameFile ? '✓' : '✗'}
                </span>
              </div>

              <div className="table-row">
                <span className="attr-name">IPFS CID</span>
                <span className="attr-value mono">{proof1.cid.substring(0, 20)}...</span>
                <span className="attr-value mono">{proof2.cid.substring(0, 20)}...</span>
                <span className={`attr-match ${comparison.sameCID ? 'yes' : 'no'}`}>
                  {comparison.sameCID ? '✓' : '✗'}
                </span>
              </div>

              <div className="table-row">
                <span className="attr-name">Timestamp</span>
                <span className="attr-value">{new Date(proof1.timestamp).toLocaleString()}</span>
                <span className="attr-value">{new Date(proof2.timestamp).toLocaleString()}</span>
                <span className="attr-match info">
                  {comparison.timeDifference !== null
                    ? formatDuration(comparison.timeDifference)
                    : '-'}
                </span>
              </div>

              <div className="table-row">
                <span className="attr-name">On-Chain</span>
                <span className="attr-value">
                  {proof1.onChain?.registered ? (
                    <span className="status-badge success">Yes</span>
                  ) : (
                    <span className="status-badge">No</span>
                  )}
                </span>
                <span className="attr-value">
                  {proof2.onChain?.registered ? (
                    <span className="status-badge success">Yes</span>
                  ) : (
                    <span className="status-badge">No</span>
                  )}
                </span>
                <span className="attr-match">-</span>
              </div>

              <div className="table-row">
                <span className="attr-name">NFT Minted</span>
                <span className="attr-value">
                  {proof1.nft?.minted ? (
                    <span className="status-badge nft">#{proof1.nft.tokenId}</span>
                  ) : (
                    <span className="status-badge">No</span>
                  )}
                </span>
                <span className="attr-value">
                  {proof2.nft?.minted ? (
                    <span className="status-badge nft">#{proof2.nft.tokenId}</span>
                  ) : (
                    <span className="status-badge">No</span>
                  )}
                </span>
                <span className="attr-match">-</span>
              </div>
            </div>

            {comparison.timeDifference !== null && comparison.timeDifference > 0 && (
              <div className="time-insight">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>
                  {comparison.proof1Older ? 'Proof 1' : 'Proof 2'} was created first,
                  {' '}{formatDuration(comparison.timeDifference)} before the other.
                </span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-box animate-fadeIn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <div className="compare-actions animate-fadeIn">
          {!comparison ? (
            <button
              className="btn btn-primary"
              onClick={runComparison}
              disabled={!proof1 || !proof2}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M8 3H5C3.89543 3 3 3.89543 3 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 3H19C20.1046 3 21 3.89543 21 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 21H5C3.89543 21 3 20.1046 3 19V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 21H19C20.1046 21 21 20.1046 21 19V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Compare Proofs
            </button>
          ) : (
            <button className="btn btn-primary" onClick={reset}>
              Compare Different Proofs
            </button>
          )}
        </div>

        {/* Use Cases */}
        <section className="use-cases">
          <h3>Use Cases</h3>
          <div className="cases-grid">
            <div className="case-card">
              <div className="case-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 9C9 7.89543 9.89543 7 11 7H13C14.1046 7 15 7.89543 15 9C15 10.1046 14.1046 11 13 11H11C9.89543 11 9 11.8954 9 13C9 14.1046 9.89543 15 11 15H13C14.1046 15 15 14.1046 15 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 5V7M12 15V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h4>Detect Tampering</h4>
              <p>Verify that a file hasn't been modified by comparing proofs from different points in time.</p>
            </div>
            <div className="case-card">
              <div className="case-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h4>Multi-party Verification</h4>
              <p>Confirm that multiple parties have certified the same document.</p>
            </div>
            <div className="case-card">
              <div className="case-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h4>Version Tracking</h4>
              <p>Track document versions by comparing proofs to identify which is newer.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Compare
