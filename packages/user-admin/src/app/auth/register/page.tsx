'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    organizationName: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          organizationName: formData.organizationName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Registration request failed:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-vscode-text mb-6">
        Create Account
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-status-error/10 border border-status-error/30 rounded-md">
          <p className="text-sm text-status-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-vscode-text-secondary mb-2">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              className="input-field"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-vscode-text-secondary mb-2">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              className="input-field"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              required
              disabled={loading}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-vscode-text-secondary mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="input-field"
            placeholder="admin@example.com"
            value={formData.email}
            onChange={handleChange('email')}
            required
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="organizationName" className="block text-sm font-medium text-vscode-text-secondary mb-2">
            Organization Name
          </label>
          <input
            id="organizationName"
            type="text"
            className="input-field"
            placeholder="Acme Corporation"
            value={formData.organizationName}
            onChange={handleChange('organizationName')}
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
            placeholder="Minimum 8 characters"
            value={formData.password}
            onChange={handleChange('password')}
            required
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-vscode-text-secondary mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="input-field"
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            required
            disabled={loading}
          />
        </div>
        
        <label className="flex items-start gap-2 text-sm text-vscode-text-secondary cursor-pointer">
          <input 
            type="checkbox" 
            className="mt-1 rounded border-vscode-border" 
            required
            disabled={loading}
          />
          <span>
            I agree to the{' '}
            <a href="#" className="text-accent-primary hover:text-accent-primary/80">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="#" className="text-accent-primary hover:text-accent-primary/80">
              Privacy Policy
            </a>
          </span>
        </label>
        
        <button 
          type="submit"
          className="btn-primary w-full mt-6"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm text-vscode-text-secondary">
        Already have an account?{' '}
        <a href="/auth/login" className="text-accent-primary hover:text-accent-primary/80 transition-colors">
          Sign in
        </a>
      </div>
    </div>
  );
}
