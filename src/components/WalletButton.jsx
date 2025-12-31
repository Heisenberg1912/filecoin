import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useBlockchainMode } from '../hooks/useBlockchain'
import './WalletButton.css'

function WalletButton() {
  const { isSimulated, setMode } = useBlockchainMode()

  return (
    <div className="wallet-section">
      {isSimulated ? (
        <div className="simulated-wallet">
          <div className="sim-status">
            <span className="sim-dot" />
            <span>Simulated Mode</span>
          </div>
          <button
            className="connect-real-btn"
            onClick={() => setMode('real')}
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="real-wallet">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted
              const connected = ready && account && chain

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <div className="wallet-buttons">
                          <button
                            onClick={openConnectModal}
                            className="connect-btn"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
                              <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="7" cy="14" r="1" fill="currentColor"/>
                            </svg>
                            Connect
                          </button>
                          <button
                            onClick={() => setMode('simulated')}
                            className="sim-btn"
                            title="Use simulated mode"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      )
                    }

                    if (chain.unsupported) {
                      return (
                        <button onClick={openChainModal} className="wrong-network-btn">
                          Wrong network
                        </button>
                      )
                    }

                    return (
                      <div className="connected-wallet">
                        <button
                          onClick={openChainModal}
                          className="chain-btn"
                          title={chain.name}
                        >
                          {chain.hasIcon && (
                            <div
                              style={{
                                background: chain.iconBackground,
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                overflow: 'hidden',
                              }}
                            >
                              {chain.iconUrl && (
                                <img
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  style={{ width: 16, height: 16 }}
                                />
                              )}
                            </div>
                          )}
                        </button>

                        <button
                          onClick={openAccountModal}
                          className="account-btn"
                        >
                          {account.displayName}
                        </button>

                        <button
                          onClick={() => setMode('simulated')}
                          className="sim-toggle-btn"
                          title="Switch to simulated mode"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    )
                  })()}
                </div>
              )
            }}
          </ConnectButton.Custom>
        </div>
      )}
    </div>
  )
}

export default WalletButton
