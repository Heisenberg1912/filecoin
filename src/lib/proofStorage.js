const STORAGE_KEY = 'proofvault_proofs'

// Get all saved proofs from localStorage
export function getSavedProofs() {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (err) {
    console.error('Failed to load proofs:', err)
    return []
  }
}

// Save a proof to localStorage
export function saveProof(proof) {
  if (typeof window === 'undefined') return false
  try {
    const proofs = getSavedProofs()
    // Check if proof already exists (by proofId)
    const existingIndex = proofs.findIndex(p => p.proofId === proof.proofId)
    if (existingIndex >= 0) {
      proofs[existingIndex] = proof
    } else {
      proofs.unshift(proof) // Add to beginning
    }
    // Keep only last 50 proofs
    const trimmedProofs = proofs.slice(0, 50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedProofs))
    return true
  } catch (err) {
    console.error('Failed to save proof:', err)
    return false
  }
}

// Delete a proof from localStorage
export function deleteProof(proofId) {
  if (typeof window === 'undefined') return false
  try {
    const proofs = getSavedProofs()
    const filtered = proofs.filter(p => p.proofId !== proofId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (err) {
    console.error('Failed to delete proof:', err)
    return false
  }
}

// Get a single proof by ID
export function getProofById(proofId) {
  const proofs = getSavedProofs()
  return proofs.find(p => p.proofId === proofId) || null
}

// Clear all proofs
export function clearAllProofs() {
  if (typeof window === 'undefined') return false
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (err) {
    console.error('Failed to clear proofs:', err)
    return false
  }
}

// Update proof with on-chain data
export function updateProofOnChain(proofId, onChainData) {
  if (typeof window === 'undefined') return false
  try {
    const proofs = getSavedProofs()
    const index = proofs.findIndex(p => p.proofId === proofId)
    if (index >= 0) {
      proofs[index] = {
        ...proofs[index],
        onChain: onChainData
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(proofs))
      return true
    }
    return false
  } catch (err) {
    console.error('Failed to update proof on-chain data:', err)
    return false
  }
}

// Update proof with NFT data
export function updateProofNFT(proofId, nftData) {
  if (typeof window === 'undefined') return false
  try {
    const proofs = getSavedProofs()
    const index = proofs.findIndex(p => p.proofId === proofId)
    if (index >= 0) {
      proofs[index] = {
        ...proofs[index],
        nft: nftData
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(proofs))
      return true
    }
    return false
  } catch (err) {
    console.error('Failed to update proof NFT data:', err)
    return false
  }
}
