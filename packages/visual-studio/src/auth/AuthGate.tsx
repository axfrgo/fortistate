import type { ReactNode } from 'react'
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
} from '@clerk/clerk-react'
import { useFortistateAuth } from './AuthContext'
import './AuthGate.css'

interface AuthGateProps {
  children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { status, error, refresh, bridgeConfigured } = useFortistateAuth()

  const bridgeBusy = bridgeConfigured && status === 'loading'
  const bridgeError = bridgeConfigured && status === 'error'

  return (
    <>
      <ClerkLoading>
        <div className="auth-shell auth-shell--centered">
          <div className="auth-card">
            <span className="auth-label">Loading authentication&hellip;</span>
            <div className="auth-spinner" />
            <p className="auth-subtitle">Verifying your session with Clerk.</p>
          </div>
        </div>
      </ClerkLoading>

      <ClerkLoaded>
        <SignedOut>
          <div className="auth-shell">
            <div className="landing-page">
              {/* Hero Section */}
              <div className="hero-section">
                <div className="hero-content">
                  <div className="hero-badge">
                    <span className="badge-dot"></span>
                    <span className="badge-text">🎨 Figma for State Management</span>
                  </div>
                  <h1 className="hero-title">
                    Build Reality with
                    <span className="gradient-text"> Fortistate</span>
                  </h1>
                  <p className="hero-subtitle">
                    The world's first <strong>cosmogenesis engine</strong> — design, test, and deploy state management 
                    with quantum mechanics, relativity, and emergence detection built-in. Transform how you think about state.
                  </p>
                  <div className="hero-stats">
                    <div className="stat-item">
                      <div className="stat-number">218</div>
                      <div className="stat-label">Tests Passing</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">&lt;7ms</div>
                      <div className="stat-label">Universe Updates</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">100%</div>
                      <div className="stat-label">Production Ready</div>
                    </div>
                  </div>
                  <div className="hero-actions">
                    <SignInButton mode="modal">
                      <button className="auth-action primary">
                        <span>Get Started Free</span>
                        <span className="arrow">→</span>
                      </button>
                    </SignInButton>
                    <button className="auth-action secondary" onClick={() => window.open('https://github.com/axfrgo/fortistate', '_blank')}>
                      <span>View on GitHub</span>
                      <span className="github-icon">⭐</span>
                    </button>
                  </div>
                </div>
                <div className="hero-visual">
                  <div className="visual-container">
                    <div className="floating-card card-1">
                      <div className="card-icon">⚛️</div>
                      <div className="card-title">Quantum State</div>
                      <div className="card-bar"></div>
                    </div>
                    <div className="floating-card card-2">
                      <div className="card-icon">🌌</div>
                      <div className="card-title">Observer Frame</div>
                      <div className="card-bar"></div>
                    </div>
                    <div className="floating-card card-3">
                      <div className="card-icon">⚖️</div>
                      <div className="card-title">Meta-Law</div>
                      <div className="card-bar"></div>
                    </div>
                    <div className="connection-line line-1"></div>
                    <div className="connection-line line-2"></div>
                    <div className="glow-orb orb-1"></div>
                    <div className="glow-orb orb-2"></div>
                  </div>
                </div>
              </div>

              {/* Trusted By Section */}
              <div className="trusted-section">
                <p className="trusted-label">Powered by cutting-edge technology</p>
                <div className="tech-badges">
                  <span className="tech-badge">React</span>
                  <span className="tech-badge">TypeScript</span>
                  <span className="tech-badge">ReactFlow</span>
                  <span className="tech-badge">Framer Motion</span>
                  <span className="tech-badge">Clerk Auth</span>
                </div>
              </div>

              {/* Features Grid */}
              <div className="features-section">
                <div className="section-header">
                  <h2 className="section-title">Revolutionary State Management</h2>
                  <p className="section-subtitle">
                    From quantum possibilities to meta-laws — Fortistate reimagines state management from first principles
                  </p>
                </div>
                <div className="features-grid">
                  <div className="feature-card featured">
                    <div className="feature-header">
                      <div className="feature-icon-large">🔤</div>
                      <div className="feature-badge">Week 1-2</div>
                    </div>
                    <h3>Possibility Algebra</h3>
                    <p>Type-safe entity definitions with constraints and universal laws. Define what <em>can</em> exist before defining what <em>does</em> exist.</p>
                    <div className="feature-tags">
                      <span className="tag">Entity</span>
                      <span className="tag">Constraint</span>
                      <span className="tag">Law</span>
                    </div>
                  </div>
                  <div className="feature-card featured">
                    <div className="feature-header">
                      <div className="feature-icon-large">⚛️</div>
                      <div className="feature-badge">Week 3-4</div>
                    </div>
                    <h3>Quantum Substrate</h3>
                    <p>States exist in superposition until observed. Entangle entities across space. Harness the probabilistic nature of quantum mechanics.</p>
                    <div className="feature-tags">
                      <span className="tag">Superposition</span>
                      <span className="tag">Entanglement</span>
                      <span className="tag">Measurement</span>
                    </div>
                  </div>
                  <div className="feature-card featured">
                    <div className="feature-header">
                      <div className="feature-icon-large">🌌</div>
                      <div className="feature-badge">Week 5-6</div>
                    </div>
                    <h3>Relativistic Frames</h3>
                    <p>Multiple observer perspectives with relative velocities. Time dilation for distributed systems. No time paradoxes, guaranteed.</p>
                    <div className="feature-tags">
                      <span className="tag">Observers</span>
                      <span className="tag">Causality</span>
                      <span className="tag">Lorentz</span>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-header">
                      <div className="feature-icon-large">⚖️</div>
                      <div className="feature-badge">Week 7-8</div>
                    </div>
                    <h3>Meta-Laws Engine</h3>
                    <p>Compose laws with AND/OR/IMPLIES/SEQUENCE operators. 7 conflict resolution strategies. Dynamic mutation at runtime.</p>
                    <div className="feature-tags">
                      <span className="tag">Composition</span>
                      <span className="tag">Conflict Resolution</span>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-header">
                      <div className="feature-icon-large">🎮</div>
                      <div className="feature-badge">Phase 3D</div>
                    </div>
                    <h3>Physics Simulations</h3>
                    <p>Classical mechanics substrate with gravity, friction, and collision detection. Build realistic physical worlds.</p>
                    <div className="feature-tags">
                      <span className="tag">Mechanics</span>
                      <span className="tag">Collisions</span>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-header">
                      <div className="feature-icon-large">🧠</div>
                      <div className="feature-badge">Phase 3E</div>
                    </div>
                    <h3>Emergence Detection</h3>
                    <p>10 pattern types detected automatically. Synchronization, oscillation, cascades, chaos. Real-time monitoring.</p>
                    <div className="feature-tags">
                      <span className="tag">Patterns</span>
                      <span className="tag">Analytics</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Use Cases Section */}
              <div className="use-cases-section">
                <div className="section-header">
                  <h2 className="section-title">Built for Real-World Applications</h2>
                  <p className="section-subtitle">From e-commerce to multiplayer games — production-ready examples included</p>
                </div>
                <div className="use-cases-grid">
                  <div className="use-case-card">
                    <div className="use-case-icon">🛍️</div>
                    <h4>E-Commerce</h4>
                    <p>Shopping carts with inventory constraints, price validation, and business rule enforcement</p>
                  </div>
                  <div className="use-case-card">
                    <div className="use-case-icon">🎮</div>
                    <h4>Multiplayer Games</h4>
                    <p>Turn-based gameplay with temporal causality and conflict-free state synchronization</p>
                  </div>
                  <div className="use-case-card">
                    <div className="use-case-icon">💰</div>
                    <h4>Banking Systems</h4>
                    <p>Transaction validation, balance constraints, and audit trails with universe management</p>
                  </div>
                  <div className="use-case-card">
                    <div className="use-case-icon">🔐</div>
                    <h4>Authentication</h4>
                    <p>Session management, role-based access control, and distributed auth flows</p>
                  </div>
                </div>
              </div>

              {/* Testimonials Section */}
              <div className="testimonials-section">
                <div className="testimonial-card">
                  <div className="quote-mark">"</div>
                  <p className="testimonial-text">
                    This isn't just state management — it's a complete paradigm shift. 
                    Quantum mechanics and relativity in a state library? Mind-blowing.
                  </p>
                  <div className="testimonial-author">
                    <div className="author-avatar">🧑‍💻</div>
                    <div>
                      <div className="author-name">Early Adopter</div>
                      <div className="author-title">Senior Developer</div>
                    </div>
                  </div>
                </div>
                <div className="testimonial-card">
                  <div className="quote-mark">"</div>
                  <p className="testimonial-text">
                    The Visual Studio makes complex state management visual and intuitive. 
                    Drag-and-drop laws with real-time execution? Game changer.
                  </p>
                  <div className="testimonial-author">
                    <div className="author-avatar">👩‍💼</div>
                    <div>
                      <div className="author-name">Product Team</div>
                      <div className="author-title">Tech Lead</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final CTA Section */}
              <div className="final-cta-section">
                <div className="cta-background">
                  <div className="cta-glow"></div>
                </div>
                <div className="cta-content">
                  <h2 className="cta-title">Ready to Build the Future?</h2>
                  <p className="cta-subtitle">
                    Join developers worldwide using Fortistate to create collaborative universes, 
                    marketplace content, and physics-based applications. Start building in seconds.
                  </p>
                  <div className="cta-actions">
                    <SignInButton mode="modal">
                      <button className="auth-action primary large">
                        <span>Start Building Now</span>
                        <span className="arrow">→</span>
                      </button>
                    </SignInButton>
                    <button className="auth-action secondary" onClick={() => window.open('https://github.com/axfrgo/fortistate#readme', '_blank')}>
                      Read Documentation
                    </button>
                  </div>
                  <div className="cta-features">
                    <div className="cta-feature">
                      <span className="check-icon">✓</span>
                      <span>Free to start</span>
                    </div>
                    <div className="cta-feature">
                      <span className="check-icon">✓</span>
                      <span>No credit card required</span>
                    </div>
                    <div className="cta-feature">
                      <span className="check-icon">✓</span>
                      <span>Production ready</span>
                    </div>
                    <div className="cta-feature">
                      <span className="check-icon">✓</span>
                      <span>218 tests passing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          {bridgeBusy && (
            <div className="auth-shell auth-shell--centered">
              <div className="auth-card">
                <span className="auth-label">Connecting to Fortistate&hellip;</span>
                <div className="auth-spinner" />
                <p className="auth-subtitle">Requesting a Fortistate session token for inspector access.</p>
              </div>
            </div>
          )}

          {bridgeError && (
            <div className="auth-shell auth-shell--centered">
              <div className="auth-card auth-error">
                <h2>Fortistate session failed</h2>
                <p className="auth-subtitle">
                  {error ?? 'We could not exchange your Clerk session for a Fortistate inspector token.'}
                </p>
                <button className="auth-action" onClick={() => refresh()}>
                  Try again
                </button>
              </div>
            </div>
          )}

          {!bridgeBusy && !bridgeError && children}
        </SignedIn>
      </ClerkLoaded>
    </>
  )
}
