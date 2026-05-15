import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

const statusOptions = ['Todo', 'In Progress', 'Done'];
const priorityOptions = ['Low', 'Medium', 'High'];

const statusBadge = (status) =>
  status === 'Done' ? 'badge-done' : status === 'In Progress' ? 'badge-progress' : 'badge-todo';
const priorityBadge = (priority) =>
  priority === 'High' ? 'badge-high' : priority === 'Medium' ? 'badge-medium' : 'badge-low';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    status: 'Todo',
    priority: 'Medium',
    dueDate: ''
  });

  const [memberEmail, setMemberEmail] = useState('');

  const isOwner = project?.owner?._id === user?.id || project?.owner?._id === user?._id;
  const canManageProject = isAdmin || isOwner;

  const loadProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data.project);
      setTasks(data.tasks);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filteredTasks = useMemo(() => {
    if (filter === 'All') return tasks;
    if (filter === 'Overdue')
      return tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done'
      );
    if (filter === 'Mine')
      return tasks.filter((t) => t.assignedTo && (t.assignedTo._id === user.id || t.assignedTo._id === user._id));
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter, user]);

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      assignedTo: '',
      status: 'Todo',
      priority: 'Medium',
      dueDate: ''
    });
    setShowTaskModal(true);
  };

  const openEditTask = (t) => {
    setEditingTask(t);
    setTaskForm({
      title: t.title,
      description: t.description || '',
      assignedTo: t.assignedTo?._id || '',
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.split('T')[0] : ''
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...taskForm,
        assignedTo: taskForm.assignedTo || null,
        dueDate: taskForm.dueDate || null
      };
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, payload);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', { ...payload, project: id });
        toast.success('Task created');
      }
      setShowTaskModal(false);
      loadProject();
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to save task';
      toast.error(msg);
    }
  };

  const handleQuickStatus = async (task, newStatus) => {
    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
      loadProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDeleteTask = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success('Task deleted');
      loadProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      toast.success('Member added');
      setMemberEmail('');
      loadProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      loadProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-32 rounded-2xl shimmer mb-6" />
        <div className="h-96 rounded-2xl shimmer" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-slate-500">
        <Link to="/projects" className="hover:text-slate-900">Projects</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{project.name}</span>
      </div>

      {/* Project header */}
      <div className="card p-6 mb-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-gradient-to-br from-brand-400 to-purple-400 opacity-10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-glow">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-2xl sm:text-3xl font-bold">{project.name}</h1>
                <span className={`badge ${project.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100'}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-slate-500 max-w-2xl">{project.description || 'No description.'}</p>
              <div className="text-xs text-slate-400 mt-2">
                Owned by {project.owner?.name} · Created {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          {(canManageProject || project.members?.some((m) => m._id === user.id || m._id === user._id)) && (
            <button onClick={openCreateTask} className="btn-primary">
              + New Task
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main: tasks */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Todo', 'In Progress', 'Done', 'Overdue', 'Mine'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  filter === f
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {f}
                {f !== 'All' && f !== 'Mine' && (
                  <span className="ml-1.5 text-xs opacity-70">
                    {f === 'Overdue'
                      ? tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done').length
                      : tasks.filter((t) => t.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-3">✨</div>
              <h3 className="font-display font-bold text-xl mb-2">No tasks here</h3>
              <p className="text-slate-500">
                {filter === 'All' ? 'Create the first task for this project.' : `No tasks match "${filter}".`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((t) => {
                const isAssignee = t.assignedTo && (t.assignedTo._id === user.id || t.assignedTo._id === user._id);
                const canEdit = canManageProject || isAssignee;
                const overdue =
                  t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done';

                return (
                  <div key={t._id} className={`card p-4 hover:shadow-glow transition-shadow ${overdue ? 'border-rose-200' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <span className={statusBadge(t.status)}>{t.status}</span>
                          <span className={priorityBadge(t.priority)}>{t.priority}</span>
                          {overdue && <span className="badge bg-rose-100 text-rose-700">Overdue</span>}
                        </div>
                        <h4 className="font-semibold text-slate-900">{t.title}</h4>
                        {t.description && <p className="text-sm text-slate-500 mt-1">{t.description}</p>}
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                          {t.assignedTo ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-600 text-[10px]">
                                {t.assignedTo.name.charAt(0).toUpperCase()}
                              </span>
                              {t.assignedTo.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">Unassigned</span>
                          )}
                          {t.dueDate && (
                            <span className={overdue ? 'text-rose-600 font-medium' : ''}>
                              📅 {new Date(t.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {canEdit && (
                          <select
                            value={t.status}
                            onChange={(e) => handleQuickStatus(t, e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                        <div className="flex gap-1">
                          {canManageProject && (
                            <>
                              <button onClick={() => openEditTask(t)} className="text-xs text-slate-500 hover:text-brand-600 px-2 py-1">
                                Edit
                              </button>
                              <button onClick={() => handleDeleteTask(t)} className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1">
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: members */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-lg mb-4">Team</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {project.owner?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{project.owner?.name}</div>
                  <div className="text-xs text-slate-500 truncate">{project.owner?.email}</div>
                </div>
                <span className="badge bg-brand-50 text-brand-700">Owner</span>
              </li>
              {project.members?.map((m) => (
                <li key={m._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{m.name}</div>
                    <div className="text-xs text-slate-500 truncate">{m.email}</div>
                  </div>
                  {canManageProject && (
                    <button
                      onClick={() => handleRemoveMember(m._id)}
                      className="text-xs text-slate-400 hover:text-rose-600"
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {canManageProject && (
              <form onSubmit={handleAddMember} className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                <input
                  type="email"
                  required
                  className="input text-sm"
                  placeholder="Member email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
                <button type="submit" className="btn-secondary text-sm whitespace-nowrap">Add</button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Task modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold mb-4">{editingTask ? 'Edit Task' : 'New Task'}</h2>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  className="input"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  className="input"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Status</label>
                  <select
                    className="input"
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  >
                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    className="input"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    {priorityOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Assign to</label>
                  <select
                    className="input"
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {[project.owner, ...(project.members || [])]
                      .filter(Boolean)
                      .filter((u, i, arr) => arr.findIndex((x) => x._id === u._id) === i)
                      .map((u) => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="label">Due date</label>
                  <input
                    type="date"
                    className="input"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingTask ? 'Save changes' : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
