import { useState, useEffect } from 'react'
import { getSavedProofs } from '../lib/proofStorage'
import { getProofStatistics } from '../lib/proofUtils'
import { getNetworkStats, getStorageAnalytics, getDealInfo, getDealHealthScore, DEAL_STATUS } from '../lib/filecoinDeals'
import GatewayStatus from '../components/GatewayStatus'
import './Analytics.css'

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function Analytics() {
  const [proofs, setProofs] = useState([])
  const [stats, setStats] = useState(null)
  const [networkStats, setNetworkStats] = useState(null)
  const [storageAnalytics, setStorageAnalytics] = useState(null)
  const [dealDetails, setDealDetails] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingDeals, setLoadingDeals] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const savedProofs = getSavedProofs()
      setProofs(savedProofs)
      setStats(getProofStatistics(savedProofs))

      // Fetch network stats
      const netStats = await getNetworkStats()
      setNetworkStats(netStats)

      // Fetch storage analytics for non-demo proofs
      const realProofs = savedProofs.filter(p => !p.demoMode && p.cid)
      if (realProofs.length > 0) {
        const analytics = await getStorageAnalytics(realProofs.map(p => p.cid))
        setStorageAnalytics(analytics)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDealDetails = async () => {
    setLoadingDeals(true)
    try {
      const realProofs = proofs.filter(p => !p.demoMode && p.cid)
      const details = await Promise.all(
        realProofs.slice(0, 10).map(async (proof) => {
          const dealInfo = await getDealInfo(proof.cid)
          const health = getDealHealthScore(dealInfo)
          return {
            proof,
            dealInfo,
            health
          }
        })
      )
      setDealDetails(details)
    } catch (err) {
      console.error('Failed to load deal details:', err)
    } finally {
      setLoadingDeals(false)
    }
  }

  // Calculate file type distribution
  const fileTypeDistribution = proofs.reduce((acc, proof) => {
    const ext = proof.fileName?.split('.').pop()?.toLowerCase() || 'unknown'
    acc[ext] = (acc[ext] || 0) + 1
    return acc
  }, {})

  const sortedFileTypes = Object.entries(fileTypeDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Calculate monthly activity
  const monthlyActivity = proofs.reduce((acc, proof) => {
    const date = new Date(proof.timestamp)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {})

  const sortedMonths = Object.entries(monthlyActivity)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)

  const maxMonthlyCount = Math.max(...sortedMonths.map(([_, count]) => count), 1)

  return (
    <div className="analytics-page">
      <div className="container">
        {/* Hero */}
        <section className="analytics-hero animate-slideUp">
          <div className="hero-badge">
            <span className="badge-dot" />
            Storage Analytics
          </div>
          <h1 className="hero-title">
            Filecoin <span className="gradient-text">Analytics</span>
          </h1>
          <p className="hero-subtitle">
            Track your storage deals, monitor network health, and analyze your proof collection.
          </p>
        </section>

        {loading ? (
          <div className="loading-state">
            <span className="spinner large" />
            <p>Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <section className="stats-section animate-fadeIn">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{stats?.totalProofs || 0}</span>
                    <span className="stat-label">Total Proofs</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{formatFileSize(stats?.totalSize || 0)}</span>
                    <span className="stat-label">Total Size</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon verified">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{stats?.onChainCount || 0}</span>
                    <span className="stat-label">On-Chain</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon nft">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{stats?.nftCount || 0}</span>
                    <span className="stat-label">NFTs Minted</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Filecoin Network Stats */}
            {networkStats && (
              <section className="network-section animate-fadeIn">
                <h2>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 12H22" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 2C14.5 4.5 15.5 8 15.5 12C15.5 16 14.5 19.5 12 22C9.5 19.5 8.5 16 8.5 12C8.5 8 9.5 4.5 12 2Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Filecoin Network
                </h2>
                {networkStats.simulated && (
                  <span className="demo-badge">Simulated Data</span>
                )}
                <div className="network-grid">
                  <div className="network-stat">
                    <span className="network-label">Total Power</span>
                    <span className="network-value">{networkStats.totalPower}</span>
                  </div>
                  <div className="network-stat">
                    <span className="network-label">Total Deals</span>
                    <span className="network-value">{networkStats.totalDeals?.toLocaleString()}</span>
                  </div>
                  <div className="network-stat">
                    <span className="network-label">Active Deals</span>
                    <span className="network-value">{networkStats.activeDeals?.toLocaleString()}</span>
                  </div>
                  <div className="network-stat">
                    <span className="network-label">Tipset Height</span>
                    <span className="network-value">{networkStats.tipsetHeight?.toLocaleString()}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Storage Analytics */}
            {storageAnalytics && (
              <section className="storage-section animate-fadeIn">
                <h2>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="7" cy="12" r="1.5" fill="currentColor"/>
                  </svg>
                  Your Storage Deals
                </h2>
                <div className="storage-grid">
                  <div className="storage-stat">
                    <span className="storage-label">Active Deals</span>
                    <span className="storage-value green">{storageAnalytics.activeDeals}</span>
                  </div>
                  <div className="storage-stat">
                    <span className="storage-label">Pending Deals</span>
                    <span className="storage-value yellow">{storageAnalytics.pendingDeals}</span>
                  </div>
                  <div className="storage-stat">
                    <span className="storage-label">Unique Providers</span>
                    <span className="storage-value">{storageAnalytics.uniqueProviders}</span>
                  </div>
                  <div className="storage-stat">
                    <span className="storage-label">Avg Replication</span>
                    <span className="storage-value">{storageAnalytics.avgReplication}x</span>
                  </div>
                </div>

                <button
                  className="btn btn-secondary load-deals-btn"
                  onClick={loadDealDetails}
                  disabled={loadingDeals}
                >
                  {loadingDeals ? (
                    <>
                      <span className="spinner" />
                      Loading Deals...
                    </>
                  ) : (
                    'View Deal Details'
                  )}
                </button>

                {/* Deal Details */}
                {dealDetails.length > 0 && (
                  <div className="deal-details">
                    <h3>Recent Deal Status</h3>
                    <div className="deals-list">
                      {dealDetails.map(({ proof, dealInfo, health }) => (
                        <div key={proof.proofId} className="deal-item">
                          <div className="deal-file">
                            <span className="deal-filename">{proof.fileName}</span>
                            <span className="deal-cid">{proof.cid?.slice(0, 20)}...</span>
                          </div>
                          <div className="deal-status">
                            <span className={`status-badge ${dealInfo.status}`}>
                              {dealInfo.status}
                            </span>
                            <span className="deal-count">
                              {dealInfo.deals?.length || 0} deals
                            </span>
                          </div>
                          <div className={`health-score ${health.color}`}>
                            <span className="score">{health.score}%</span>
                            <span className="label">{health.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Activity Chart */}
            <section className="charts-section animate-fadeIn">
              <div className="chart-card">
                <h3>Monthly Activity</h3>
                <div className="bar-chart">
                  {sortedMonths.map(([month, count]) => (
                    <div key={month} className="bar-item">
                      <div
                        className="bar"
                        style={{ height: `${(count / maxMonthlyCount) * 100}%` }}
                      >
                        <span className="bar-value">{count}</span>
                      </div>
                      <span className="bar-label">{month.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>File Types</h3>
                <div className="type-list">
                  {sortedFileTypes.map(([type, count]) => (
                    <div key={type} className="type-item">
                      <div className="type-info">
                        <span className="type-ext">.{type}</span>
                        <span className="type-count">{count} files</span>
                      </div>
                      <div className="type-bar">
                        <div
                          className="type-fill"
                          style={{ width: `${(count / proofs.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Gateway Status */}
            <section className="gateway-section animate-fadeIn">
              <GatewayStatus />
            </section>

            {/* Mode Distribution */}
            <section className="distribution-section animate-fadeIn">
              <h2>Storage Mode</h2>
              <div className="distribution-bar">
                <div
                  className="dist-segment real"
                  style={{ width: `${((stats?.realCount || 0) / (stats?.totalProofs || 1)) * 100}%` }}
                  title={`Real: ${stats?.realCount || 0}`}
                >
                  {stats?.realCount > 0 && (
                    <span>Filecoin ({stats?.realCount})</span>
                  )}
                </div>
                <div
                  className="dist-segment demo"
                  style={{ width: `${((stats?.demoCount || 0) / (stats?.totalProofs || 1)) * 100}%` }}
                  title={`Demo: ${stats?.demoCount || 0}`}
                >
                  {stats?.demoCount > 0 && (
                    <span>Demo ({stats?.demoCount})</span>
                  )}
                </div>
              </div>
              <div className="distribution-legend">
                <div className="legend-item">
                  <span className="legend-color real" />
                  <span>Stored on Filecoin</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color demo" />
                  <span>Demo Mode (Local Only)</span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default Analytics
