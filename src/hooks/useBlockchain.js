import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { simulatedBlockchain, isSimulatedMode } from '../lib/wagmiConfig'
import { ProofRegistryABI, ProofNFTABI } from '../lib/contractABIs'
import contractConfigJson from '../lib/contracts.json'

// Get contract addresses from environment variables with fallback
const getContractAddresses = () => ({
  ProofRegistry: import.meta.env.VITE_PROOF_REGISTRY_ADDRESS || contractConfigJson.contracts.ProofRegistry,
  ProofNFT: import.meta.env.VITE_PROOF_NFT_ADDRESS || contractConfigJson.contracts.ProofNFT,
})

const contractConfig = {
  contracts: getContractAddresses()
}

// Convert hex string to bytes32
function hashToBytes32(hash) {
  // Remove 0x prefix if present
  const cleanHash = hash.startsWith('0x') ? hash.slice(2) : hash
  return `0x${cleanHash}`
}

// Hook for registering proof on-chain
export function useRegisterProof() {
  const { isConnected, address } = useAccount()
  const [simulatedState, setSimulatedState] = useState({
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    txHash: null,
    blockNumber: null,
  })

  const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({ hash })

  const registerProof = useCallback(async (proofId, sha256Hash, cid) => {
    // Check if using simulated mode
    if (isSimulatedMode()) {
      setSimulatedState({ isPending: true, isSuccess: false, isError: false, error: null, txHash: null })

      try {
        const result = await simulatedBlockchain.registerProof(proofId, hashToBytes32(sha256Hash), cid)
        setSimulatedState({
          isPending: false,
          isSuccess: true,
          isError: false,
          error: null,
          txHash: result.hash,
          blockNumber: result.blockNumber,
        })
        return result
      } catch (err) {
        setSimulatedState({
          isPending: false,
          isSuccess: false,
          isError: true,
          error: err.message,
          txHash: null,
        })
        throw err
      }
    }

    // Real blockchain transaction
    if (!isConnected) {
      throw new Error('Please connect your wallet first')
    }

    writeContract({
      address: contractConfig.contracts.ProofRegistry,
      abi: ProofRegistryABI,
      functionName: 'registerProof',
      args: [proofId, hashToBytes32(sha256Hash), cid],
    })
  }, [isConnected, writeContract])

  const reset = useCallback(() => {
    setSimulatedState({
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      txHash: null,
      blockNumber: null,
    })
  }, [])

  // Return combined state
  if (isSimulatedMode()) {
    return {
      registerProof,
      reset,
      isPending: simulatedState.isPending,
      isConfirming: false,
      isSuccess: simulatedState.isSuccess,
      isError: simulatedState.isError,
      error: simulatedState.error,
      txHash: simulatedState.txHash,
      blockNumber: simulatedState.blockNumber,
      isSimulated: true,
    }
  }

  return {
    registerProof,
    reset,
    isPending: isWritePending,
    isConfirming,
    isSuccess: isConfirmed,
    isError: !!writeError,
    error: writeError?.message,
    txHash: hash,
    blockNumber: receipt?.blockNumber,
    isSimulated: false,
  }
}

// Hook for minting NFT
export function useMintNFT() {
  const { isConnected } = useAccount()
  const [simulatedState, setSimulatedState] = useState({
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    txHash: null,
    tokenId: null,
  })

  const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({ hash })

  const mintNFT = useCallback(async (proofId, sha256Hash, cid, fileName, fileSize) => {
    if (isSimulatedMode()) {
      setSimulatedState({ isPending: true, isSuccess: false, isError: false, error: null, txHash: null, tokenId: null })

      try {
        const result = await simulatedBlockchain.mintProof(proofId, hashToBytes32(sha256Hash), cid, fileName, fileSize)
        setSimulatedState({
          isPending: false,
          isSuccess: true,
          isError: false,
          error: null,
          txHash: result.hash,
          tokenId: result.tokenId,
        })
        return result
      } catch (err) {
        setSimulatedState({
          isPending: false,
          isSuccess: false,
          isError: true,
          error: err.message,
          txHash: null,
          tokenId: null,
        })
        throw err
      }
    }

    if (!isConnected) {
      throw new Error('Please connect your wallet first')
    }

    writeContract({
      address: contractConfig.contracts.ProofNFT,
      abi: ProofNFTABI,
      functionName: 'mintProof',
      args: [proofId, hashToBytes32(sha256Hash), cid, fileName, BigInt(fileSize)],
    })
  }, [isConnected, writeContract])

  const reset = useCallback(() => {
    setSimulatedState({
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      txHash: null,
      tokenId: null,
    })
  }, [])

  if (isSimulatedMode()) {
    return {
      mintNFT,
      reset,
      isPending: simulatedState.isPending,
      isConfirming: false,
      isSuccess: simulatedState.isSuccess,
      isError: simulatedState.isError,
      error: simulatedState.error,
      txHash: simulatedState.txHash,
      tokenId: simulatedState.tokenId,
      isSimulated: true,
    }
  }

  return {
    mintNFT,
    reset,
    isPending: isWritePending,
    isConfirming,
    isSuccess: isConfirmed,
    isError: !!writeError,
    error: writeError?.message,
    txHash: hash,
    tokenId: null, // Would need to parse from receipt logs
    isSimulated: false,
  }
}

// Hook for checking if proof exists on-chain
export function useProofExists(proofId) {
  if (isSimulatedMode()) {
    return {
      data: proofId ? simulatedBlockchain.proofExists(proofId) : false,
      isLoading: false,
      isError: false,
    }
  }

  const { data, isLoading, isError } = useReadContract({
    address: contractConfig.contracts.ProofRegistry,
    abi: ProofRegistryABI,
    functionName: 'proofExists',
    args: [proofId],
    enabled: !!proofId,
  })

  return { data, isLoading, isError }
}

// Hook for checking if NFT is minted
export function useNFTMinted(proofId) {
  if (isSimulatedMode()) {
    return {
      data: proofId ? simulatedBlockchain.isProofMinted(proofId) : false,
      isLoading: false,
      isError: false,
    }
  }

  const { data, isLoading, isError } = useReadContract({
    address: contractConfig.contracts.ProofNFT,
    abi: ProofNFTABI,
    functionName: 'isProofMinted',
    args: [proofId],
    enabled: !!proofId,
  })

  return { data, isLoading, isError }
}

// Hook for getting on-chain proof data
export function useOnChainProof(proofId) {
  if (isSimulatedMode()) {
    const proof = proofId ? simulatedBlockchain.getProof(proofId) : null
    return {
      data: proof,
      isLoading: false,
      isError: false,
    }
  }

  const { data, isLoading, isError } = useReadContract({
    address: contractConfig.contracts.ProofRegistry,
    abi: ProofRegistryABI,
    functionName: 'getProof',
    args: [proofId],
    enabled: !!proofId,
  })

  return { data, isLoading, isError }
}

// Hook for blockchain mode
export function useBlockchainMode() {
  const [mode, setMode] = useState(() => isSimulatedMode() ? 'simulated' : 'real')
  const { isConnected } = useAccount()

  const toggleMode = useCallback(() => {
    const newMode = mode === 'simulated' ? 'real' : 'simulated'
    localStorage.setItem('proofvault_blockchain_mode', newMode)
    setMode(newMode)
  }, [mode])

  return {
    mode,
    isSimulated: mode === 'simulated',
    isReal: mode === 'real',
    isWalletConnected: isConnected,
    canUseRealMode: isConnected,
    toggleMode,
    setMode: (m) => {
      localStorage.setItem('proofvault_blockchain_mode', m)
      setMode(m)
    },
  }
}
