'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secretKey }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success! Redirect to dashboard
        console.log('✅ Login successful, redirecting to dashboard...');
        // Use window.location for a hard redirect to ensure middleware runs
        window.location.href = '/dashboard';
      } else {
        setErrorMessage(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-background-secondary rounded-lg border border-slate-700">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            🔐 FortiState
          </h1>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Super Admin Dashboard
          </h2>
          <p className="text-sm text-foreground-muted">
            Internal Platform Management
          </p>
        </div>

        {/* Error Messages */}
        {error === 'unauthorized' && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded">
            <p className="text-sm">Session expired. Please login again.</p>
          </div>
        )}
        
        {error === 'ip_blocked' && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded">
            <p className="text-sm font-semibold">Access Denied</p>
            <p className="text-sm">Your IP address is not whitelisted.</p>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded">
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="secretKey" className="block text-sm font-medium text-foreground mb-2">
              Secret Key
            </label>
            <input
              id="secretKey"
              name="secretKey"
              type="password"
              autoComplete="off"
              required
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-slate-600 rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
              placeholder="Enter your secret key"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-foreground-muted">
              Enter the SUPER_ADMIN_SECRET_KEY from your environment
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !secretKey}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="pt-6 border-t border-slate-700">
          <div className="flex items-start space-x-2 text-xs text-foreground-muted">
            <svg className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold text-foreground-secondary">Security Notice</p>
              <p className="mt-1">
                This dashboard provides full platform access. All actions are logged and monitored.
                Only authorized personnel should access this system.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-foreground-muted">
          <p>Session expires after 8 hours of inactivity</p>
          <p className="mt-1">IP: {mounted ? 'Checking...' : 'Loading...'}</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
