import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Member' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', form);
      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Signup failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex relative bg-slate-900 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-brand-600 to-slate-900 opacity-90" />
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 opacity-30 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-400 to-brand-500 opacity-30 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center font-bold">T</div>
            <span className="font-display font-bold text-xl">TaskFlow</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-display text-4xl lg:text-5xl font-bold leading-tight">
            Start managing your team's work in minutes.
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Sign up, invite teammates, and track progress in one place.
          </p>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © {new Date().getFullYear()} TaskFlow
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="font-display text-3xl font-bold mb-2">Create your account</h2>
          <p className="text-slate-500 mb-8">Get started — it's free.</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="label">Full name</label>
              <input
                type="text"
                required
                minLength={2}
                className="input"
                placeholder="Jane Cooper"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <div className="grid grid-cols-2 gap-3">
                {['Admin', 'Member'].map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setForm({ ...form, role: r })}
                    className={`p-3 rounded-xl border text-sm font-medium transition ${
                      form.role === r
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {r}
                    <span className="block text-xs font-normal opacity-70 mt-0.5">
                      {r === 'Admin' ? 'Create & manage' : 'Work on tasks'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-slate-900 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
