'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Seal from './Seal';
import TricolorFlag from './TricolorFlag';

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Invalid username or password. Please try again.');
      }
    } catch (err) {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <TricolorFlag />
      <div className="login-card">
        <div className="login-card-top">
          <Seal size={44} />
          <h1>Municipal Road Hazard Monitoring Portal</h1>
          <div className="sub">Administrator Access — PotholePulse Pilot Deployment</div>
        </div>
        <form className="login-body" onSubmit={handleSubmit}>
          {error ? <div className="login-error">{error}</div> : null}
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <div className="demo-creds-box">
          Demo credentials — Username: <strong>admin</strong>&nbsp;&nbsp;Password: <strong>admin123</strong>
        </div>
      </div>
    </div>
  );
}
