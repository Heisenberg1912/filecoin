import './TransactionStatus.css'

function TransactionStatus({
  isPending,
  isConfirming,
  isSuccess,
  isError,
  error,
  txHash,
  isSimulated,
  onClose,
  successMessage = 'Transaction confirmed!',
  pendingMessage = 'Waiting for confirmation...',
}) {
  if (!isPending && !isConfirming && !isSuccess && !isError) {
    return null
  }

  const getExplorerUrl = (hash) => {
    if (isSimulated) return null
    return `https://amoy.polygonscan.com/tx/${hash}`
  }

  return (
    <div className="tx-status-overlay">
      <div className="tx-status-modal">
        {(isPending || isConfirming) && (
          <>
            <div className="tx-spinner" />
            <h3>{isPending ? 'Submitting Transaction' : 'Confirming...'}</h3>
            <p>{pendingMessage}</p>
            {txHash && (
              <div className="tx-hash">
                <span>Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                {!isSimulated && (
                  <a href={getExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                )}
              </div>
            )}
            {isSimulated && (
              <span className="simulated-badge">Simulated Mode</span>
            )}
          </>
        )}

        {isSuccess && (
          <>
            <div className="tx-success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Success!</h3>
            <p>{successMessage}</p>
            {txHash && (
              <div className="tx-hash">
                <span>Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                {!isSimulated && (
                  <a href={getExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer">
                    View on Explorer
                  </a>
                )}
              </div>
            )}
            {isSimulated && (
              <span className="simulated-badge">Simulated Mode</span>
            )}
            <button className="tx-close-btn" onClick={onClose}>
              Close
            </button>
          </>
        )}

        {isError && (
          <>
            <div className="tx-error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Transaction Failed</h3>
            <p className="tx-error-message">{error || 'Unknown error occurred'}</p>
            <button className="tx-close-btn" onClick={onClose}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default TransactionStatus
