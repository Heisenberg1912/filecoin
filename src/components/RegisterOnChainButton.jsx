import { useState } from 'react'
import { useRegisterProof, useProofExists, useBlockchainMode } from '../hooks/useBlockchain'
import TransactionStatus from './TransactionStatus'
import './RegisterOnChainButton.css'

function RegisterOnChainButton({ proof, onRegistered }) {
  const { mode, isSimulated } = useBlockchainMode()
  const { data: alreadyRegistered } = useProofExists(proof?.proofId)
  const {
    registerProof,
    reset,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    txHash,
    blockNumber,
  } = useRegisterProof()

  const [showStatus, setShowStatus] = useState(false)

  const handleRegister = async () => {
    if (!proof) return

    setShowStatus(true)
    try {
      const result = await registerProof(proof.proofId, proof.sha256Hash, proof.cid)
      if (onRegistered) {
        onRegistered({
          txHash: result?.hash || txHash,
          blockNumber: result?.blockNumber || blockNumber,
          isSimulated,
        })
      }
    } catch (err) {
      console.error('Registration failed:', err)
    }
  }

  const handleClose = () => {
    setShowStatus(false)
    reset()
  }

  if (alreadyRegistered) {
    return (
      <div className="register-onchain registered">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <span>Registered On-Chain</span>
        {isSimulated && <span className="sim-badge">Simulated</span>}
      </div>
    )
  }

  return (
    <>
      <button
        className="register-onchain-btn"
        onClick={handleRegister}
        disabled={isPending || isConfirming || !proof}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 9H21M9 21V9" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Register On-Chain
        {isSimulated && <span className="sim-badge">Simulated</span>}
      </button>

      {showStatus && (
        <TransactionStatus
          isPending={isPending}
          isConfirming={isConfirming}
          isSuccess={isSuccess}
          isError={isError}
          error={error}
          txHash={txHash}
          isSimulated={isSimulated}
          onClose={handleClose}
          successMessage="Proof registered on-chain!"
          pendingMessage="Registering your proof on the blockchain..."
        />
      )}
    </>
  )
}

export default RegisterOnChainButton
