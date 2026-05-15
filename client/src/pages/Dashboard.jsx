import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

const StatCard = ({ label, value, accent, hint }) => (
  <div className="card p-5 relative overflow-hidden">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl ${accent}`} />
    <div className="relative">
      <div className="text-sm text-slate-500 font-medium">{label}</div>
      <div className="text-3xl font-display font-bold mt-2">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  </div>
);

const statusBadge = (status) =>
  status === 'Done' ? 'badge-done' : status === 'In Progress' ? 'badge-progress' : 'badge-todo';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api
      .get('/tasks/dashboard/stats')
      .then((res) => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl shimmer" />
          ))}
        </div>
        <div className="h-64 rounded-2xl shimmer" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome back, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening across your projects.</p>
        </div>
        <Link to="/projects" className="btn-primary">
          View all projects →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Projects" value={stats.totalProjects} accent="bg-brand-400" />
        <StatCard label="Total Tasks" value={stats.totalTasks} accent="bg-purple-400" />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          accent="bg-amber-400"
          hint={`${stats.done} completed`}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          accent="bg-rose-400"
          hint={stats.overdue > 0 ? 'Needs attention' : 'All good ✓'}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Status breakdown */}
        <div className="card p-6 lg:col-span-1">
          <h3 className="font-display font-bold text-lg mb-4">Task Status</h3>
          <div className="space-y-4">
            {[
              { label: 'To Do', value: stats.todo, color: 'bg-slate-400' },
              { label: 'In Progress', value: stats.inProgress, color: 'bg-amber-400' },
              { label: 'Done', value: stats.done, color: 'bg-emerald-400' }
            ].map((row) => {
              const pct = stats.totalTasks
                ? Math.round((row.value / stats.totalTasks) * 100)
                : 0;
              return (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{row.label}</span>
                    <span className="text-slate-500">{row.value} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* My tasks */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">My Tasks</h3>
            <span className="text-sm text-slate-500">{stats.myTasksCount} assigned</span>
          </div>
          {stats.myTasks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No tasks assigned to you yet. Take it easy! ☕
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.myTasks.map((t) => (
                <li key={t._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${t.project?._id || t.project}`}
                      className="font-medium text-slate-900 hover:text-brand-600 truncate block"
                    >
                      {t.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {t.project?.name} {t.dueDate && `· Due ${new Date(t.dueDate).toLocaleDateString()}`}
                    </div>
                  </div>
                  <span className={statusBadge(t.status)}>{t.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Overdue */}
        <div className="card p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">
              Overdue Tasks{' '}
              {stats.overdue > 0 && (
                <span className="ml-2 text-sm text-rose-600 font-semibold">({stats.overdue})</span>
              )}
            </h3>
          </div>
          {stats.overdueTasks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              🎉 No overdue tasks. Great work!
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.overdueTasks.map((t) => (
                <Link
                  key={t._id}
                  to={`/projects/${t.project?._id || t.project}`}
                  className="block p-4 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition"
                >
                  <div className="font-medium text-slate-900 truncate">{t.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{t.project?.name}</div>
                  <div className="text-xs text-rose-600 font-medium mt-2">
                    Due {new Date(t.dueDate).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
