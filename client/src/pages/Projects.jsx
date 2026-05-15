import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

const Projects = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetch = () => {
    setLoading(true);
    api
      .get('/projects')
      .then((res) => setProjects(res.data.projects))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created');
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete project "${name}"? All its tasks will be removed.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? 'Manage all projects across your workspace.' : 'Projects you own or belong to.'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl shimmer" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">📋</div>
          <h3 className="font-display font-bold text-xl mb-2">No projects yet</h3>
          <p className="text-slate-500 mb-6">
            {isAdmin ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}
          </p>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p._id} className="card p-5 hover:shadow-glow transition-shadow group">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className={`badge ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {p.status}
                </span>
              </div>
              <Link
                to={`/projects/${p._id}`}
                className="font-display font-bold text-lg hover:text-brand-600 transition block"
              >
                {p.name}
              </Link>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[2.5rem]">
                {p.description || 'No description.'}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[p.owner, ...(p.members || [])].slice(0, 4).map((m, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-semibold text-slate-600"
                      title={m?.name}
                    >
                      {m?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  ))}
                  {p.members?.length > 3 && (
                    <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-slate-600">
                      +{p.members.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Link to={`/projects/${p._id}`} className="text-sm font-medium text-slate-700 hover:text-brand-600 px-2 py-1">
                    Open →
                  </Link>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(p._id, p.name)}
                      className="text-sm text-slate-400 hover:text-rose-600 px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                      title="Delete project"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold mb-4">New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Project name</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  className="input"
                  placeholder="e.g. Q3 Marketing Campaign"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  className="input"
                  placeholder="What is this project about?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
