import { useState } from 'react'
import { useMintNFT, useNFTMinted, useBlockchainMode } from '../hooks/useBlockchain'
import TransactionStatus from './TransactionStatus'
import './MintNFTModal.css'

function MintNFTModal({ proof, isOpen, onClose, onMinted }) {
  const { isSimulated } = useBlockchainMode()
  const { data: alreadyMinted } = useNFTMinted(proof?.proofId)
  const {
    mintNFT,
    reset,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    txHash,
    tokenId,
  } = useMintNFT()

  const [showStatus, setShowStatus] = useState(false)

  if (!isOpen || !proof) return null

  const handleMint = async () => {
    setShowStatus(true)
    try {
      const result = await mintNFT(
        proof.proofId,
        proof.sha256Hash,
        proof.cid,
        proof.fileName,
        proof.fileSize
      )
      if (onMinted) {
        onMinted({
          txHash: result?.hash || txHash,
          tokenId: result?.tokenId || tokenId,
          isSimulated,
        })
      }
    } catch (err) {
      console.error('Minting failed:', err)
    }
  }

  const handleStatusClose = () => {
    setShowStatus(false)
    reset()
    if (isSuccess) {
      onClose()
    }
  }

  if (alreadyMinted) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="mint-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="mint-header">
            <div className="mint-icon minted">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h2>Already Minted</h2>
            <p>This proof already has an NFT certificate</p>
          </div>

          <div className="mint-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="mint-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="mint-header">
            <div className="mint-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Mint NFT Certificate</h2>
            <p>Create a permanent NFT representing your proof</p>
          </div>

          <div className="mint-preview">
            <div className="nft-card">
              <div className="nft-header">
                <span className="nft-label">PROOFVAULT</span>
                <span className="nft-type">CERTIFICATE</span>
              </div>
              <div className="nft-content">
                <div className="nft-row">
                  <span>File</span>
                  <span className="truncate">{proof.fileName}</span>
                </div>
                <div className="nft-row">
                  <span>Proof ID</span>
                  <span className="mono">{proof.proofId}</span>
                </div>
                <div className="nft-row">
                  <span>Hash</span>
                  <span className="mono truncate">{proof.sha256Hash.slice(0, 16)}...</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mint-info">
            <div className="info-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>NFT will be minted on {isSimulated ? 'simulated chain' : 'Polygon'}</span>
            </div>
            <div className="info-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>On-chain metadata, transferable ownership</span>
            </div>
          </div>

          {isSimulated && (
            <div className="simulated-notice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Simulated Mode - No real blockchain transaction
            </div>
          )}

          <div className="mint-actions">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-mint"
              onClick={handleMint}
              disabled={isPending || isConfirming}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Mint NFT
            </button>
          </div>
        </div>
      </div>

      {showStatus && (
        <TransactionStatus
          isPending={isPending}
          isConfirming={isConfirming}
          isSuccess={isSuccess}
          isError={isError}
          error={error}
          txHash={txHash}
          isSimulated={isSimulated}
          onClose={handleStatusClose}
          successMessage={`NFT Certificate minted! ${tokenId ? `Token ID: #${tokenId}` : ''}`}
          pendingMessage="Minting your NFT certificate..."
        />
      )}
    </>
  )
}

export default MintNFTModal
