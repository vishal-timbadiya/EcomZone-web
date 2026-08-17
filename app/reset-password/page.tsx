"use client";

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Could not reset your password');
        return;
      }

      setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all';

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-gray-600">This reset link is missing its token.</p>
        <Link href="/forgot-password" className="text-orange-600 font-semibold hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-700">Your password has been reset.</p>
        <Link
          href="/login"
          className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-2xl text-red-800 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">
          New password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-1">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          className={inputClass}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-semibold ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
        }`}
      >
        {loading ? 'Resetting...' : 'Reset password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-orange-600 bg-clip-text text-transparent">
            Set a new password
          </h1>
        </div>

        <Suspense fallback={<p className="text-center text-gray-500">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
