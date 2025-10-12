'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Login request failed:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-vscode-text mb-6">
        Sign In
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-status-error/10 border border-status-error/30 rounded-md">
          <p className="text-sm text-status-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-vscode-text-secondary mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="input-field"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-vscode-text-secondary mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input-field"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-vscode-text-secondary cursor-pointer">
            <input type="checkbox" className="rounded border-vscode-border" />
            <span>Remember me</span>
          </label>
          <a href="#" className="text-accent-primary hover:text-accent-primary/80 transition-colors">
            Forgot password?
          </a>
        </div>
        
        <button 
          type="submit" 
          className="btn-primary w-full mt-6"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm text-vscode-text-secondary">
  Don&apos;t have an account?{' '}
        <a href="/auth/register" className="text-accent-primary hover:text-accent-primary/80 transition-colors">
          Sign up
        </a>
      </div>
    </div>
  );
}
