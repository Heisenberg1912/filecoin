/**
 * ProofVault API Service
 * Provides programmatic access to proof generation and verification
 */

import { uploadFile, getGatewayUrl, getExplorerUrl, isDemoMode } from './web3storage'
import { saveProof, getSavedProofs, getProofById } from './proofStorage'
import { getWebhooks, triggerWebhook } from './webhooks'

// API Version
export const API_VERSION = 'v1'

// Generate unique proof ID
function generateProofId() {
  return `PV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

// SHA-256 hash function
async function hashBuffer(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Create a new proof from file data
 * @param {File|Blob|ArrayBuffer} fileData - The file to create proof for
 * @param {Object} options - Options for proof creation
 * @returns {Promise<Object>} The created proof
 */
export async function createProof(fileData, options = {}) {
  const {
    fileName = 'unnamed-file',
    fileType = 'application/octet-stream',
    metadata = {},
    skipUpload = false
  } = options

  try {
    // Convert to ArrayBuffer if needed
    let buffer
    let file

    if (fileData instanceof ArrayBuffer) {
      buffer = fileData
      file = new Blob([buffer], { type: fileType })
    } else if (fileData instanceof Blob || fileData instanceof File) {
      buffer = await fileData.arrayBuffer()
      file = fileData
    } else {
      throw new Error('Invalid file data format')
    }

    // Generate hash
    const sha256Hash = await hashBuffer(buffer)

    // Upload to IPFS/Filecoin (unless skipped)
    let cid = null
    if (!skipUpload) {
      cid = await uploadFile(file)
    }

    const timestamp = new Date()

    const proof = {
      proofId: generateProofId(),
      fileName: fileName,
      fileSize: buffer.byteLength,
      fileType: fileType,
      sha256Hash: sha256Hash,
      cid: cid,
      timestamp: timestamp.toISOString(),
      timestampReadable: timestamp.toLocaleString(),
      unixTimestamp: Math.floor(timestamp.getTime() / 1000),
      gatewayUrl: cid ? getGatewayUrl(cid) : null,
      explorerUrl: cid ? getExplorerUrl(cid) : null,
      demoMode: isDemoMode(),
      metadata: metadata,
      apiVersion: API_VERSION
    }

    // Save proof
    saveProof(proof)

    // Trigger webhooks
    triggerWebhook('proof_created', proof)

    return {
      success: true,
      data: proof
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * Verify a proof against a file
 * @param {string} proofId - The proof ID to verify
 * @param {File|Blob|ArrayBuffer} fileData - The file to verify against
 * @returns {Promise<Object>} Verification result
 */
export async function verifyProof(proofId, fileData) {
  try {
    const proof = getProofById(proofId)

    if (!proof) {
      return {
        success: false,
        verified: false,
        error: 'Proof not found'
      }
    }

    // Convert to ArrayBuffer if needed
    let buffer
    if (fileData instanceof ArrayBuffer) {
      buffer = fileData
    } else if (fileData instanceof Blob || fileData instanceof File) {
      buffer = await fileData.arrayBuffer()
    } else {
      throw new Error('Invalid file data format')
    }

    const fileHash = await hashBuffer(buffer)
    const isMatch = fileHash === proof.sha256Hash

    const result = {
      success: true,
      verified: isMatch,
      proof: proof,
      providedHash: fileHash,
      expectedHash: proof.sha256Hash,
      timestamp: new Date().toISOString()
    }

    // Trigger webhooks
    triggerWebhook('proof_verified', {
      proofId,
      verified: isMatch,
      timestamp: result.timestamp
    })

    return result
  } catch (err) {
    return {
      success: false,
      verified: false,
      error: err.message
    }
  }
}

/**
 * Get a proof by ID
 * @param {string} proofId - The proof ID
 * @returns {Object|null} The proof or null
 */
export function getProof(proofId) {
  const proof = getProofById(proofId)
  if (!proof) {
    return {
      success: false,
      error: 'Proof not found'
    }
  }
  return {
    success: true,
    data: proof
  }
}

/**
 * Get proof by hash
 * @param {string} hash - The SHA-256 hash
 * @returns {Object|null} The proof or null
 */
export function getProofByHash(hash) {
  const proofs = getSavedProofs()
  const proof = proofs.find(p => p.sha256Hash === hash)
  if (!proof) {
    return {
      success: false,
      error: 'Proof not found'
    }
  }
  return {
    success: true,
    data: proof
  }
}

/**
 * Get proof by CID
 * @param {string} cid - The IPFS CID
 * @returns {Object|null} The proof or null
 */
export function getProofByCid(cid) {
  const proofs = getSavedProofs()
  const proof = proofs.find(p => p.cid === cid)
  if (!proof) {
    return {
      success: false,
      error: 'Proof not found'
    }
  }
  return {
    success: true,
    data: proof
  }
}

/**
 * List all proofs with pagination
 * @param {Object} options - List options
 * @returns {Object} Paginated proofs
 */
export function listProofs(options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'timestamp',
    sortOrder = 'desc',
    filter = {}
  } = options

  let proofs = getSavedProofs()

  // Apply filters
  if (filter.demoMode !== undefined) {
    proofs = proofs.filter(p => p.demoMode === filter.demoMode)
  }
  if (filter.onChain !== undefined) {
    proofs = proofs.filter(p => !!p.onChain?.registered === filter.onChain)
  }
  if (filter.hasNft !== undefined) {
    proofs = proofs.filter(p => !!p.nft?.minted === filter.hasNft)
  }
  if (filter.search) {
    const term = filter.search.toLowerCase()
    proofs = proofs.filter(p =>
      p.fileName.toLowerCase().includes(term) ||
      p.proofId.toLowerCase().includes(term) ||
      p.sha256Hash.toLowerCase().includes(term)
    )
  }

  // Sort
  proofs.sort((a, b) => {
    let aVal, bVal
    switch (sortBy) {
      case 'fileName':
        aVal = a.fileName
        bVal = b.fileName
        break
      case 'fileSize':
        aVal = a.fileSize
        bVal = b.fileSize
        break
      default:
        aVal = new Date(a.timestamp)
        bVal = new Date(b.timestamp)
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1
    }
    return aVal < bVal ? 1 : -1
  })

  // Paginate
  const total = proofs.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const data = proofs.slice(start, start + limit)

  return {
    success: true,
    data: data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}

/**
 * Export proofs to various formats
 * @param {string} format - Export format (json, csv)
 * @param {Object} options - Export options
 * @returns {string} Exported data
 */
export function exportProofs(format = 'json', options = {}) {
  const { proofIds = null } = options

  let proofs = getSavedProofs()

  if (proofIds && Array.isArray(proofIds)) {
    proofs = proofs.filter(p => proofIds.includes(p.proofId))
  }

  if (format === 'csv') {
    const headers = ['proofId', 'fileName', 'fileSize', 'sha256Hash', 'cid', 'timestamp', 'demoMode']
    const rows = proofs.map(p => [
      p.proofId,
      `"${p.fileName}"`,
      p.fileSize,
      p.sha256Hash,
      p.cid || '',
      p.timestamp,
      p.demoMode
    ])
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  }

  return JSON.stringify(proofs, null, 2)
}

/**
 * Get API statistics
 * @returns {Object} API stats
 */
export function getApiStats() {
  const proofs = getSavedProofs()
  const webhooks = getWebhooks()

  return {
    success: true,
    data: {
      totalProofs: proofs.length,
      totalSize: proofs.reduce((sum, p) => sum + (p.fileSize || 0), 0),
      onChainCount: proofs.filter(p => p.onChain?.registered).length,
      nftCount: proofs.filter(p => p.nft?.minted).length,
      demoCount: proofs.filter(p => p.demoMode).length,
      realCount: proofs.filter(p => !p.demoMode).length,
      webhooksConfigured: webhooks.length,
      apiVersion: API_VERSION
    }
  }
}

// API endpoint definitions for documentation
export const API_ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/v1/proofs',
    name: 'Create Proof',
    description: 'Upload a file and generate a cryptographic proof',
    params: [
      { name: 'file', type: 'File', required: true, description: 'The file to create proof for' },
      { name: 'fileName', type: 'string', required: false, description: 'Custom file name' },
      { name: 'metadata', type: 'object', required: false, description: 'Additional metadata' }
    ],
    response: {
      proofId: 'PV-1234567890-ABC123',
      sha256Hash: '64-char hex string',
      cid: 'IPFS CID',
      timestamp: 'ISO timestamp'
    }
  },
  {
    method: 'GET',
    path: '/api/v1/proofs/:id',
    name: 'Get Proof',
    description: 'Retrieve a proof by its ID',
    params: [
      { name: 'id', type: 'string', required: true, description: 'The proof ID' }
    ],
    response: {
      proofId: 'PV-1234567890-ABC123',
      fileName: 'document.pdf',
      fileSize: 1024,
      sha256Hash: '...',
      cid: 'bafy...'
    }
  },
  {
    method: 'POST',
    path: '/api/v1/proofs/:id/verify',
    name: 'Verify Proof',
    description: 'Verify a file against an existing proof',
    params: [
      { name: 'id', type: 'string', required: true, description: 'The proof ID' },
      { name: 'file', type: 'File', required: true, description: 'The file to verify' }
    ],
    response: {
      verified: true,
      expectedHash: '...',
      providedHash: '...'
    }
  },
  {
    method: 'GET',
    path: '/api/v1/proofs',
    name: 'List Proofs',
    description: 'List all proofs with pagination and filtering',
    params: [
      { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
      { name: 'limit', type: 'number', required: false, description: 'Items per page (default: 10)' },
      { name: 'sortBy', type: 'string', required: false, description: 'Sort field: timestamp, fileName, fileSize' },
      { name: 'search', type: 'string', required: false, description: 'Search term' }
    ],
    response: {
      data: [],
      pagination: { page: 1, limit: 10, total: 100, totalPages: 10 }
    }
  },
  {
    method: 'GET',
    path: '/api/v1/proofs/hash/:hash',
    name: 'Get by Hash',
    description: 'Find a proof by SHA-256 hash',
    params: [
      { name: 'hash', type: 'string', required: true, description: 'SHA-256 hash' }
    ]
  },
  {
    method: 'GET',
    path: '/api/v1/proofs/cid/:cid',
    name: 'Get by CID',
    description: 'Find a proof by IPFS CID',
    params: [
      { name: 'cid', type: 'string', required: true, description: 'IPFS Content ID' }
    ]
  },
  {
    method: 'GET',
    path: '/api/v1/export',
    name: 'Export Proofs',
    description: 'Export proofs to JSON or CSV format',
    params: [
      { name: 'format', type: 'string', required: false, description: 'Export format: json, csv' }
    ]
  },
  {
    method: 'GET',
    path: '/api/v1/stats',
    name: 'Get Statistics',
    description: 'Get API usage statistics',
    params: []
  }
]
