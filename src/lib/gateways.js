/**
 * Gateway Management System
 * Handles multiple IPFS gateways for retrieval optimization
 */

// List of public IPFS gateways
export const GATEWAYS = [
  {
    id: 'w3s',
    name: 'Web3.Storage',
    url: 'https://w3s.link/ipfs/',
    priority: 1,
    type: 'primary'
  },
  {
    id: 'dweb',
    name: 'Dweb.link',
    url: 'https://dweb.link/ipfs/',
    priority: 2,
    type: 'primary'
  },
  {
    id: 'ipfs-io',
    name: 'IPFS.io',
    url: 'https://ipfs.io/ipfs/',
    priority: 3,
    type: 'public'
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    url: 'https://cloudflare-ipfs.com/ipfs/',
    priority: 4,
    type: 'public'
  },
  {
    id: 'pinata',
    name: 'Pinata',
    url: 'https://gateway.pinata.cloud/ipfs/',
    priority: 5,
    type: 'public'
  },
  {
    id: 'nftstorage',
    name: 'NFT.Storage',
    url: 'https://nftstorage.link/ipfs/',
    priority: 6,
    type: 'public'
  }
]

// Gateway health status cache
const healthCache = new Map()
const HEALTH_CHECK_INTERVAL = 60000 // 1 minute
const HEALTH_CHECK_TIMEOUT = 5000 // 5 seconds

// Test CID for health checks (small known file)
const TEST_CID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'

/**
 * Check if a gateway is healthy
 */
export async function checkGatewayHealth(gateway) {
  const cacheKey = gateway.id
  const cached = healthCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < HEALTH_CHECK_INTERVAL) {
    return cached.status
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT)

    const startTime = performance.now()
    const response = await fetch(`${gateway.url}${TEST_CID}`, {
      method: 'HEAD',
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    const latency = Math.round(performance.now() - startTime)

    const status = {
      healthy: response.ok,
      latency,
      lastChecked: new Date().toISOString(),
      error: null
    }

    healthCache.set(cacheKey, { status, timestamp: Date.now() })
    return status
  } catch (err) {
    const status = {
      healthy: false,
      latency: null,
      lastChecked: new Date().toISOString(),
      error: err.name === 'AbortError' ? 'Timeout' : err.message
    }

    healthCache.set(cacheKey, { status, timestamp: Date.now() })
    return status
  }
}

/**
 * Get all gateways with their health status
 */
export async function getGatewaysWithHealth() {
  const results = await Promise.all(
    GATEWAYS.map(async (gateway) => {
      const health = await checkGatewayHealth(gateway)
      return { ...gateway, health }
    })
  )

  // Sort by health (healthy first) then by latency
  return results.sort((a, b) => {
    if (a.health.healthy && !b.health.healthy) return -1
    if (!a.health.healthy && b.health.healthy) return 1
    if (a.health.healthy && b.health.healthy) {
      return (a.health.latency || 9999) - (b.health.latency || 9999)
    }
    return a.priority - b.priority
  })
}

/**
 * Get the best available gateway
 */
export async function getBestGateway() {
  const gateways = await getGatewaysWithHealth()
  return gateways.find(g => g.health.healthy) || gateways[0]
}

/**
 * Get URL for a CID using the best gateway
 */
export async function getOptimizedUrl(cid) {
  const gateway = await getBestGateway()
  return `${gateway.url}${cid}`
}

/**
 * Fetch from IPFS with automatic gateway failover
 */
export async function fetchWithFailover(cid, options = {}) {
  const gateways = await getGatewaysWithHealth()
  const healthyGateways = gateways.filter(g => g.health.healthy)
  const gatewaysToTry = healthyGateways.length > 0 ? healthyGateways : gateways.slice(0, 3)

  let lastError = null

  for (const gateway of gatewaysToTry) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000)

      const response = await fetch(`${gateway.url}${cid}`, {
        signal: controller.signal,
        ...options
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        return {
          response,
          gateway: gateway.name,
          url: `${gateway.url}${cid}`
        }
      }
    } catch (err) {
      lastError = err
      console.warn(`Gateway ${gateway.name} failed:`, err.message)
    }
  }

  throw lastError || new Error('All gateways failed')
}

/**
 * Get gateway URL by ID
 */
export function getGatewayUrl(gatewayId, cid) {
  const gateway = GATEWAYS.find(g => g.id === gatewayId)
  if (!gateway) {
    return `https://w3s.link/ipfs/${cid}`
  }
  return `${gateway.url}${cid}`
}

/**
 * Get selected gateway from localStorage
 */
export function getPreferredGateway() {
  const saved = localStorage.getItem('proofvault_preferred_gateway')
  if (saved) {
    const gateway = GATEWAYS.find(g => g.id === saved)
    if (gateway) return gateway
  }
  return GATEWAYS[0]
}

/**
 * Set preferred gateway
 */
export function setPreferredGateway(gatewayId) {
  localStorage.setItem('proofvault_preferred_gateway', gatewayId)
}

/**
 * Clear health cache
 */
export function clearHealthCache() {
  healthCache.clear()
}
