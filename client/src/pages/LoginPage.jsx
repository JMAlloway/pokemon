import { useState } from 'react';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-accent">Poke</span><span className="text-text-primary">Arb</span>
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Pokemon card arbitrage scanner
          </p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            {isRegister ? 'Create account' : 'Sign in'}
          </h2>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                  required={isRegister}
                  maxLength={100}
                  placeholder="Choose a username"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
                {isRegister ? 'Email' : 'Username or Email'}
              </label>
              <input
                id="email"
                type={isRegister ? 'email' : 'text'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                required
                placeholder={isRegister ? 'you@example.com' : 'Username or email'}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                required
                minLength={8}
                placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
