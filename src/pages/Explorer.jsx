import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSavedProofs, deleteProof } from '../lib/proofStorage'
import {
  getProofStatistics,
  generateQRCode,
  downloadPDFCertificate,
  generateTwitterShareURL,
  getCollections,
  saveCollection,
  deleteCollection,
  createCollection,
  addProofToCollection,
  removeProofFromCollection
} from '../lib/proofUtils'
import './Explorer.css'

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function Explorer() {
  const navigate = useNavigate()
  const [proofs, setProofs] = useState([])
  const [collections, setCollections] = useState([])
  const [view, setView] = useState('proofs') // 'proofs' | 'collections'
  const [filter, setFilter] = useState('all') // 'all' | 'onchain' | 'nft' | 'demo'
  const [sortBy, setSortBy] = useState('date') // 'date' | 'name' | 'size'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProof, setSelectedProof] = useState(null)
  const [qrCode, setQrCode] = useState(null)
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const savedProofs = getSavedProofs()
    setProofs(savedProofs)
    setStats(getProofStatistics(savedProofs))
    setCollections(getCollections())
  }

  const filteredProofs = proofs
    .filter(proof => {
      if (filter === 'onchain') return proof.onChain?.registered
      if (filter === 'nft') return proof.nft?.minted
      if (filter === 'demo') return proof.demoMode
      if (filter === 'real') return !proof.demoMode
      return true
    })
    .filter(proof => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        proof.fileName.toLowerCase().includes(term) ||
        proof.proofId.toLowerCase().includes(term) ||
        proof.sha256Hash.toLowerCase().includes(term)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.fileName.localeCompare(b.fileName)
      if (sortBy === 'size') return b.fileSize - a.fileSize
      return new Date(b.timestamp) - new Date(a.timestamp)
    })

  const handleProofSelect = async (proof) => {
    setSelectedProof(proof)
    const qr = await generateQRCode(JSON.stringify({
      proofId: proof.proofId,
      hash: proof.sha256Hash,
      cid: proof.cid
    }))
    setQrCode(qr)
  }

  const handleDelete = (proofId) => {
    if (window.confirm('Are you sure you want to delete this proof?')) {
      deleteProof(proofId)
      loadData()
      if (selectedProof?.proofId === proofId) {
        setSelectedProof(null)
      }
    }
  }

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return
    const collection = createCollection(newCollectionName.trim())
    saveCollection(collection)
    setNewCollectionName('')
    setShowNewCollection(false)
    loadData()
  }

  const handleDeleteCollection = (collectionId) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      deleteCollection(collectionId)
      loadData()
    }
  }

  const handleAddToCollection = (collectionId, proofId) => {
    addProofToCollection(collectionId, proofId)
    loadData()
  }

  const getCollectionProofs = (collection) => {
    return proofs.filter(p => collection.proofIds.includes(p.proofId))
  }

  return (
    <div className="explorer">
      <div className="container">
        <section className="explorer-hero animate-slideUp">
          <div className="hero-badge">
            <span className="badge-dot" />
            Proof Explorer
          </div>
          <h1 className="hero-title">
            Your Proof<br />
            <span className="gradient-text">Gallery</span>
          </h1>
          <p className="hero-subtitle">
            Browse, organize, and manage all your proof certificates in one place.
          </p>
        </section>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-bar animate-fadeIn">
            <div className="stat-item">
              <span className="stat-value">{stats.totalProofs}</span>
              <span className="stat-label">Total Proofs</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatFileSize(stats.totalSize)}</span>
              <span className="stat-label">Total Size</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.onChainCount}</span>
              <span className="stat-label">On-Chain</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.nftCount}</span>
              <span className="stat-label">NFTs Minted</span>
            </div>
          </div>
        )}

        <div className="explorer-layout">
          {/* Sidebar */}
          <aside className="explorer-sidebar animate-fadeIn">
            {/* View Toggle */}
            <div className="sidebar-section">
              <h4>View</h4>
              <div className="view-toggle">
                <button
                  className={`view-btn ${view === 'proofs' ? 'active' : ''}`}
                  onClick={() => setView('proofs')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Proofs
                </button>
                <button
                  className={`view-btn ${view === 'collections' ? 'active' : ''}`}
                  onClick={() => setView('collections')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5C2 3.89543 2.89543 3 4 3H9L11 6H20C21.1046 6 22 6.89543 22 8V19Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Collections
                </button>
              </div>
            </div>

            {/* Filters */}
            {view === 'proofs' && (
              <div className="sidebar-section">
                <h4>Filter</h4>
                <div className="filter-list">
                  {[
                    { id: 'all', label: 'All Proofs', count: proofs.length },
                    { id: 'onchain', label: 'On-Chain', count: stats?.onChainCount || 0 },
                    { id: 'nft', label: 'With NFT', count: stats?.nftCount || 0 },
                    { id: 'demo', label: 'Demo', count: stats?.demoCount || 0 },
                    { id: 'real', label: 'Real', count: stats?.realCount || 0 }
                  ].map(f => (
                    <button
                      key={f.id}
                      className={`filter-btn ${filter === f.id ? 'active' : ''}`}
                      onClick={() => setFilter(f.id)}
                    >
                      <span>{f.label}</span>
                      <span className="filter-count">{f.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Collections List */}
            {view === 'collections' && (
              <div className="sidebar-section">
                <div className="section-header">
                  <h4>Collections</h4>
                  <button
                    className="add-btn"
                    onClick={() => setShowNewCollection(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {showNewCollection && (
                  <div className="new-collection-form">
                    <input
                      type="text"
                      placeholder="Collection name"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                    />
                    <button onClick={handleCreateCollection}>Create</button>
                  </div>
                )}
                <div className="collections-list">
                  {collections.map(col => (
                    <div key={col.id} className="collection-item">
                      <div className="collection-info">
                        <span className="collection-name">{col.name}</span>
                        <span className="collection-count">{col.proofIds.length} proofs</span>
                      </div>
                      <button
                        className="collection-delete"
                        onClick={() => handleDeleteCollection(col.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  {collections.length === 0 && (
                    <p className="empty-message">No collections yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Sort */}
            {view === 'proofs' && (
              <div className="sidebar-section">
                <h4>Sort By</h4>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="date">Date (Newest)</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="size">Size (Largest)</option>
                </select>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="explorer-main">
            {/* Search */}
            <div className="search-bar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search proofs by name, ID, or hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Proofs Grid */}
            {view === 'proofs' && (
              <div className="proofs-grid">
                {filteredProofs.length > 0 ? (
                  filteredProofs.map(proof => (
                    <div
                      key={proof.proofId}
                      className={`proof-card ${selectedProof?.proofId === proof.proofId ? 'selected' : ''}`}
                      onClick={() => handleProofSelect(proof)}
                    >
                      <div className="proof-card-header">
                        <div className="proof-file-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                        <div className="proof-badges">
                          {proof.demoMode && <span className="badge demo">Demo</span>}
                          {proof.onChain?.registered && <span className="badge onchain">On-Chain</span>}
                          {proof.nft?.minted && <span className="badge nft">NFT</span>}
                        </div>
                      </div>
                      <div className="proof-card-body">
                        <h4 className="proof-filename">{proof.fileName}</h4>
                        <p className="proof-meta">
                          {formatFileSize(proof.fileSize)} • {new Date(proof.timestamp).toLocaleDateString()}
                        </p>
                        <code className="proof-hash">{proof.sha256Hash.substring(0, 16)}...</code>
                      </div>
                      <div className="proof-card-actions">
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadPDFCertificate(proof) }}
                          title="Download PDF"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(generateTwitterShareURL(proof), '_blank') }}
                          title="Share on Twitter"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(proof.proofId) }}
                          title="Delete"
                          className="delete-btn"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <h3>No proofs found</h3>
                    <p>Create your first proof to see it here</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                      Create Proof
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Collections View */}
            {view === 'collections' && (
              <div className="collections-grid">
                {collections.length > 0 ? (
                  collections.map(col => (
                    <div key={col.id} className="collection-card">
                      <div className="collection-card-header">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M22 19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5C2 3.89543 2.89543 3 4 3H9L11 6H20C21.1046 6 22 6.89543 22 8V19Z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <h4>{col.name}</h4>
                      </div>
                      <p className="collection-meta">{col.proofIds.length} proofs • Created {new Date(col.createdAt).toLocaleDateString()}</p>
                      <div className="collection-proofs-preview">
                        {getCollectionProofs(col).slice(0, 3).map(proof => (
                          <div key={proof.proofId} className="preview-item">
                            <span>{proof.fileName}</span>
                          </div>
                        ))}
                        {col.proofIds.length > 3 && (
                          <span className="more-count">+{col.proofIds.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M22 19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5C2 3.89543 2.89543 3 4 3H9L11 6H20C21.1046 6 22 6.89543 22 8V19Z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <h3>No collections yet</h3>
                    <p>Create a collection to organize your proofs</p>
                    <button className="btn btn-primary" onClick={() => setShowNewCollection(true)}>
                      Create Collection
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Detail Panel */}
          {selectedProof && (
            <aside className="detail-panel animate-slideIn">
              <div className="detail-header">
                <h3>Proof Details</h3>
                <button className="close-btn" onClick={() => setSelectedProof(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="detail-content">
                {qrCode && (
                  <div className="qr-section">
                    <img src={qrCode} alt="QR Code" className="qr-code" />
                    <p>Scan to verify</p>
                  </div>
                )}

                <div className="detail-row">
                  <span className="detail-label">Proof ID</span>
                  <span className="detail-value mono">{selectedProof.proofId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">File Name</span>
                  <span className="detail-value">{selectedProof.fileName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Size</span>
                  <span className="detail-value">{formatFileSize(selectedProof.fileSize)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{selectedProof.timestampReadable}</span>
                </div>
                <div className="detail-row full">
                  <span className="detail-label">SHA-256 Hash</span>
                  <code className="detail-hash">{selectedProof.sha256Hash}</code>
                </div>
                <div className="detail-row full">
                  <span className="detail-label">IPFS CID</span>
                  <code className="detail-hash cid">{selectedProof.cid}</code>
                </div>

                {selectedProof.onChain?.registered && (
                  <div className="detail-badge success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Registered on Polygon
                  </div>
                )}

                {selectedProof.nft?.minted && (
                  <div className="detail-badge nft">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    NFT Token #{selectedProof.nft.tokenId}
                  </div>
                )}

                <div className="detail-actions">
                  <a href={selectedProof.gatewayUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                    View on IPFS
                  </a>
                  <button className="btn btn-primary" onClick={() => downloadPDFCertificate(selectedProof)}>
                    Download PDF
                  </button>
                </div>

                {/* Add to Collection */}
                {collections.length > 0 && (
                  <div className="add-to-collection">
                    <span className="detail-label">Add to Collection</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddToCollection(e.target.value, selectedProof.proofId)
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">Select collection...</option>
                      {collections.map(col => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

export default Explorer
