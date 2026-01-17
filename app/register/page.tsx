'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/app/src/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Client } from '@/app/src/types';

export default function RegisterPage() {
  const { register, isLoading, isAuthenticated, currentUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, currentUser, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!clientId || clientId.trim().length === 0) {
      setError('Please enter a Client ID');
      return;
    }

    try {
      await register(email, password, clientId);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          CloudFlex Portal
        </h1>
        
        <h2 style={{ 
          fontSize: '1.25rem', 
          marginBottom: '1.5rem',
          color: '#666',
          textAlign: 'center'
        }}>
          Create Account
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label 
              htmlFor="email" 
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={isLoading}
              placeholder="Min. 8 characters"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="confirmPassword" 
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={isLoading}
              placeholder="Re-enter password"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="clientId" 
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
            >
              Client ID
            </label>
            <input
              id="clientId"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your company's Client ID"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: isLoading ? '#ccc' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ 
          marginTop: '1.5rem', 
          textAlign: 'center',
          color: '#666',
          fontSize: '0.875rem'
        }}>
          Already have an account?{' '}
          <Link 
            href="/login" 
            style={{ 
              color: '#2563eb', 
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Sign In
          </Link>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          fontSize: '0.75rem',
          color: '#666'
        }}>
          <strong>Need a Client ID?</strong>
          <div style={{ marginTop: '0.5rem' }}>Ask your company admin for the Client ID to join your organization.</div>
          <div style={{ marginTop: '0.5rem' }}>Password must be at least 6 characters.</div>
        </div>
      </div>
    </div>
  );
}
