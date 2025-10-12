import React from 'react'

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    // Log to console for now; telemetry can be added later
    console.error('ErrorBoundary caught an error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleCloseOverlays = () => {
    window.dispatchEvent(new CustomEvent('closeOverlays'))
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f1724',
          color: 'white',
          padding: 24,
        }}>
          <div style={{ maxWidth: 740 }}>
            <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
            <p style={{ opacity: 0.85 }}>The app encountered an unexpected error. You can reload the page or try to close any overlays that might be blocking rendering.</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
              <button onClick={this.handleReload} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}>Reload page</button>
              <button onClick={this.handleCloseOverlays} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'white', cursor: 'pointer' }}>Close overlays</button>
            </div>
            {this.state.error ? (
              <details style={{ marginTop: 18, color: 'rgba(255,255,255,0.75)' }}>
                <summary>Technical details</summary>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.stack}</pre>
              </details>
            ) : null}
          </div>
        </div>
      )
    }

    return this.props.children as React.ReactElement
  }
}
