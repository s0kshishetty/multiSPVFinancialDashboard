import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const Login: React.FC = () => {
  const { token, user, loading, error, login, register } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('investor@nexus.com');
  const [password, setPassword] = useState('password123');

  if (token && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === 'login') {
      await login(email, password);
    } else {
      await register(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md p-8 border border-white/10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Nexus SPV
          </h1>
          <p className="text-gray-400 mt-2">Sign in to manage your SPV portfolio.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 bg-surface/50 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-surface/80 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-surface/80 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary"
                minLength={6}
                required
              />
            </div>
          </div>

          {error && <div className="p-3 bg-danger/20 text-danger rounded-lg text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-6">
          Demo account after seeding: investor@nexus.com / password123
        </p>
      </div>
    </div>
  );
};

export default Login;
