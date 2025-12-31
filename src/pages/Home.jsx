import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  uploadFile as uploadToFilecoin,
  getGatewayUrl,
  getExplorerUrl,
  isDemoMode,
  setDemoMode,
  isRegistered
} from '../lib/web3storage'
import { saveProof, getSavedProofs, updateProofOnChain } from '../lib/proofStorage'
import { generateQRCode, downloadPDFCertificate, generateTwitterShareURL } from '../lib/proofUtils'
import RegisterModal from '../components/RegisterModal'
import RegisterOnChainButton from '../components/RegisterOnChainButton'
import MintNFTModal from '../components/MintNFTModal'
import './Home.css'

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

function Home() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [proof, setProof] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(null)
  const [demoMode, setDemoModeState] = useState(true)
  const [recentProofs, setRecentProofs] = useState([])
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showMintModal, setShowMintModal] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    setRecentProofs(getSavedProofs().slice(0, 3))
    // Check registration status on mount
    isRegistered().then(setRegistered)
  }, [])

  const handleModeSwitch = async (toDemo) => {
    if (toDemo) {
      setDemoModeState(true)
    } else {
      // Switching to Filecoin mode - check if registered
      const isReg = await isRegistered()
      setRegistered(isReg)
      if (isReg) {
        setDemoModeState(false)
      } else {
        setShowRegisterModal(true)
      }
    }
  }

  const handleRegistered = async () => {
    setRegistered(true)
    setDemoModeState(false)
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
    setError(null)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setProof(null)
    }
  }, [])

  const handleChange = (e) => {
    e.preventDefault()
    setError(null)
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setProof(null)
    }
  }

  const generateProof = async () => {
    if (!file) return

    setDemoMode(demoMode)
    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      setUploadProgress(15)
      const fileHash = await hashFile(file)

      setUploadProgress(40)
      const cid = await uploadToFilecoin(file)

      setUploadProgress(85)
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

      setUploadProgress(100)
      setProof(proofData)
      saveProof(proofData)
      setRecentProofs(getSavedProofs().slice(0, 3))

      // Generate QR code
      const qr = await generateQRCode(JSON.stringify({
        proofId: proofData.proofId,
        hash: proofData.sha256Hash,
        cid: proofData.cid
      }))
      setQrCode(qr)

    } catch (err) {
      setError(err.message || 'Failed to generate proof')
      if (isDemoMode()) {
        setDemoModeState(true)
      }
    } finally {
      setUploading(false)
    }
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

  const downloadProofJSON = () => {
    if (!proof) return
    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proof-${proof.proofId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setFile(null)
    setProof(null)
    setError(null)
    setUploadProgress(0)
    setQrCode(null)
  }

  const handleOnChainRegistered = (data) => {
    if (proof) {
      const updatedProof = {
        ...proof,
        onChain: {
          registered: true,
          txHash: data.txHash,
          blockNumber: data.blockNumber,
          isSimulated: data.isSimulated,
          registeredAt: new Date().toISOString()
        }
      }
      setProof(updatedProof)
      updateProofOnChain(proof.proofId, updatedProof.onChain)
      setRecentProofs(getSavedProofs().slice(0, 3))
    }
  }

  const handleNFTMinted = (data) => {
    if (proof) {
      const updatedProof = {
        ...proof,
        nft: {
          minted: true,
          txHash: data.txHash,
          tokenId: data.tokenId,
          isSimulated: data.isSimulated,
          mintedAt: new Date().toISOString()
        }
      }
      setProof(updatedProof)
      saveProof(updatedProof)
      setRecentProofs(getSavedProofs().slice(0, 3))
    }
    setShowMintModal(false)
  }

  return (
    <div className="home">
      <div className="container">
        {/* Hero */}
        <section className="hero animate-slideUp">
          <div className="hero-badge">
            <span className="badge-dot" />
            Powered by Builtattic
          </div>
          <h1 className="hero-title">
            Cryptographic Proof<br />
            <span className="gradient-text">for Your Files</span>
          </h1>
          <p className="hero-subtitle">
            Generate verifiable proof certificates with SHA-256 hashes and timestamps
            stored permanently on the Filecoin network.
          </p>
        </section>

        {/* Main Card */}
        <div className="main-card animate-fadeIn">
          {!proof ? (
            <>
              {/* Mode Toggle */}
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${demoMode ? 'active' : ''}`}
                  onClick={() => handleModeSwitch(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Demo Mode
                </button>
                <button
                  className={`mode-btn ${!demoMode ? 'active' : ''}`}
                  onClick={() => handleModeSwitch(false)}
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
                className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />

                {file ? (
                  <div className="file-preview">
                    <div className="file-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      className="file-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="drop-content">
                    <div className="drop-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="url(#uploadGradient)" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M17 8L12 3L7 8" stroke="url(#uploadGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 3V15" stroke="url(#uploadGradient)" strokeWidth="2" strokeLinecap="round"/>
                        <defs>
                          <linearGradient id="uploadGradient" x1="3" y1="3" x2="21" y2="21">
                            <stop stopColor="#6366f1"/>
                            <stop offset="1" stopColor="#a855f7"/>
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <p className="drop-text">
                      <strong>Drop your file here</strong>
                      <span>or click to browse</span>
                    </p>
                    <span className="drop-hint">Supports all file types up to 100MB</span>
                  </div>
                )}
              </div>

              {/* Progress */}
              {uploading && (
                <div className="progress-section">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="progress-text">
                    {uploadProgress < 30 ? 'Hashing file...' :
                     uploadProgress < 80 ? 'Uploading to IPFS...' :
                     'Generating proof...'}
                  </span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="error-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                className="btn btn-primary generate-btn"
                onClick={generateProof}
                disabled={!file || uploading}
              >
                {uploading ? (
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
                    Generate Proof
                  </>
                )}
              </button>

              {/* Recent Proofs */}
              {recentProofs.length > 0 && (
                <div className="recent-proofs">
                  <h4>Recent Proofs</h4>
                  <div className="recent-list">
                    {recentProofs.map((p) => (
                      <button
                        key={p.proofId}
                        className="recent-item"
                        onClick={() => setProof(p)}
                      >
                        <div className="recent-info">
                          <span className="recent-name">{p.fileName}</span>
                          <span className="recent-meta">
                            {formatFileSize(p.fileSize)} • {new Date(p.timestamp).toLocaleDateString()}
                            {p.demoMode && <span className="demo-badge">Demo</span>}
                          </span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Proof Display */
            <div className="proof-display">
              <div className="proof-header">
                <div className="proof-success-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <h3>Proof Generated</h3>
                  <p className="proof-id">{proof.proofId}</p>
                </div>
                {proof.demoMode && <span className="demo-tag">Demo</span>}
              </div>

              <div className="proof-details">
                <div className="proof-row">
                  <span className="proof-label">File</span>
                  <span className="proof-value">{proof.fileName}</span>
                </div>
                <div className="proof-row">
                  <span className="proof-label">Size</span>
                  <span className="proof-value">{formatFileSize(proof.fileSize)}</span>
                </div>
                <div className="proof-row">
                  <span className="proof-label">Timestamp</span>
                  <span className="proof-value">{proof.timestampReadable}</span>
                </div>
                <div className="proof-row-full">
                  <span className="proof-label">SHA-256 Hash</span>
                  <div className="hash-box">
                    <code>{proof.sha256Hash}</code>
                    <button onClick={() => copyToClipboard(proof.sha256Hash, 'hash')}>
                      {copied === 'hash' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="proof-row-full">
                  <span className="proof-label">IPFS CID</span>
                  <div className="hash-box">
                    <code>{proof.cid}</code>
                    <button onClick={() => copyToClipboard(proof.cid, 'cid')}>
                      {copied === 'cid' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="proof-links">
                  <a href={proof.gatewayUrl} target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    View on IPFS
                  </a>
                  <a href={proof.explorerUrl} target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Filecoin Explorer
                  </a>
                </div>

                {/* QR Code */}
                {qrCode && (
                  <div className="qr-section">
                    <img src={qrCode} alt="QR Code" className="qr-code" />
                    <span>Scan to verify</span>
                  </div>
                )}
              </div>

              {/* Blockchain Actions */}
              <div className="blockchain-actions">
                <RegisterOnChainButton
                  proof={proof}
                  onRegistered={handleOnChainRegistered}
                />
                <button
                  className="btn btn-mint"
                  onClick={() => setShowMintModal(true)}
                  disabled={proof?.nft?.minted}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {proof?.nft?.minted ? 'NFT Minted' : 'Mint NFT'}
                </button>
              </div>

              <div className="proof-actions">
                <button className="btn btn-primary" onClick={downloadProofJSON}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  JSON
                </button>
                <button className="btn btn-pdf" onClick={() => downloadPDFCertificate(proof)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  PDF
                </button>
                <button
                  className="btn btn-twitter"
                  onClick={() => window.open(generateTwitterShareURL(proof), '_blank')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
                  </svg>
                  Share
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/verify')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Verify
                </button>
                <button className="btn btn-ghost" onClick={reset}>
                  New
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <section className="features">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h4>Immutable Proof</h4>
            <p>SHA-256 hashes stored permanently on Filecoin via IPFS, creating unalterable records.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4>NFT Certificates</h4>
            <p>Mint your proof as an NFT with on-chain metadata. Own and trade your certificates.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h4>Batch Upload</h4>
            <p>Certify multiple files at once. Perfect for bulk document authentication.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 7H10V10H7V7Z" fill="currentColor"/>
                <path d="M14 7H17V10H14V7Z" fill="currentColor"/>
                <path d="M7 14H10V17H7V14Z" fill="currentColor"/>
                <path d="M14 14H17V17H14V14Z" fill="currentColor"/>
              </svg>
            </div>
            <h4>QR Verification</h4>
            <p>Generate scannable QR codes for instant mobile proof verification.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h4>PDF Certificates</h4>
            <p>Download professional PDF certificates with embedded QR codes and metadata.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h4>On-Chain Registry</h4>
            <p>Register proofs on Polygon for additional tamper-proof blockchain verification.</p>
          </div>
        </section>
      </div>

      {/* Registration Modal */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegistered={handleRegistered}
      />

      {/* Mint NFT Modal */}
      <MintNFTModal
        proof={proof}
        isOpen={showMintModal}
        onClose={() => setShowMintModal(false)}
        onMinted={handleNFTMinted}
      />
    </div>
  )
}

export default Home
