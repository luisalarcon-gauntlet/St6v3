import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { normalizeError } from '@/api/client';

const DEMO_USERS = [
  { name: 'Alice Chen', email: 'alice@st6.example', role: 'MANAGER' as const },
  { name: 'Bob Martinez', email: 'bob@st6.example', role: 'MEMBER' as const },
  { name: 'Carol Nguyen', email: 'carol@st6.example', role: 'MEMBER' as const },
  { name: 'Dave Kim', email: 'dave@st6.example', role: 'ADMIN' as const },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  MANAGER: 'text-primary bg-primary/10 border-primary/30',
  MEMBER: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  async function handleLogin(loginEmail: string, loginPassword: string) {
    setError('');
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/');
    } catch (err) {
      const appError = normalizeError(err);
      setError(appError.detail);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await handleLogin(email, password);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-surface border border-border rounded-lg p-8">
          <h1 className="text-2xl font-sans font-bold text-white mb-6">
            ST6 Weekly Commits
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="text-danger text-sm">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-2 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-gray-400 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-2 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white rounded py-2 font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {(import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true') && (
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4">
              Dev Quick Login
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  disabled={submitting}
                  onClick={() => handleLogin(u.email, 'Password1!')}
                  className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3 text-left hover:border-gray-500 transition-colors disabled:opacity-50"
                >
                  <div>
                    <div className="text-white text-sm font-medium">{u.name}</div>
                    <div className="text-gray-500 text-xs font-mono">{u.email}</div>
                  </div>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border ${ROLE_COLORS[u.role]}`}
                  >
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
