const Task = require('../models/Task');
const Project = require('../models/Project');

const userHasProjectAccess = (project, userId) => {
  return (
    project.owner.toString() === userId.toString() ||
    project.members.some((m) => m.toString() === userId.toString())
  );
};

// GET /api/tasks - list tasks (filterable)
exports.getTasks = async (req, res) => {
  try {
    const { project, status, assignedTo, overdue } = req.query;
    const filter = {};

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Non-admins only see tasks in projects they belong to
    if (req.user.role !== 'Admin') {
      const accessibleProjects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }]
      }).select('_id');
      const ids = accessibleProjects.map((p) => p._id);
      filter.project = filter.project
        ? ids.find((id) => id.toString() === filter.project) || null
        : { $in: ids };
    }

    let tasks = await Task.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    if (overdue === 'true') {
      tasks = tasks.filter((t) => t.isOverdue);
    }

    res.json({ count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, project: projectId, assignedTo, status, priority, dueDate } =
      req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Only Admins or project owner can create tasks
    if (
      req.user.role !== 'Admin' &&
      project.owner.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: 'Only Admins or project owner can create tasks' });
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate: dueDate || null
    });

    await task.populate('assignedTo', 'name email role');
    await task.populate('createdBy', 'name email role');
    await task.populate('project', 'name');

    res.status(201).json({ message: 'Task created', task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/:id
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('project', 'name owner members');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (
      req.user.role !== 'Admin' &&
      !userHasProjectAccess(task.project, req.user._id)
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ task });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAdmin = req.user.role === 'Admin';
    const isOwner = task.project.owner.toString() === req.user._id.toString();
    const isAssignee =
      task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    const isProjectMember = userHasProjectAccess(task.project, req.user._id);

    if (!isProjectMember && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, assignedTo, status, priority, dueDate } = req.body;

    // Members (non-admin/non-owner) can only update status of their assigned tasks
    if (!isAdmin && !isOwner) {
      if (!isAssignee) {
        return res
          .status(403)
          .json({ message: 'Only assignee, project owner or admin can update this task' });
      }
      // Restrict members to only changing status
      if (status !== undefined) task.status = status;
    } else {
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
    }

    await task.save();
    await task.populate('assignedTo', 'name email role');
    await task.populate('createdBy', 'name email role');
    await task.populate('project', 'name');

    res.json({ message: 'Task updated', task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAdmin = req.user.role === 'Admin';
    const isOwner = task.project.owner.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ message: 'Only Admin or project owner can delete tasks' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';

    // Get accessible projects
    let projectFilter = {};
    if (!isAdmin) {
      projectFilter = {
        $or: [{ owner: req.user._id }, { members: req.user._id }]
      };
    }
    const accessibleProjects = await Project.find(projectFilter).select('_id');
    const projectIds = accessibleProjects.map((p) => p._id);

    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    const now = new Date();

    const myTasks = allTasks.filter(
      (t) => t.assignedTo && t.assignedTo._id.toString() === req.user._id.toString()
    );

    const stats = {
      totalProjects: accessibleProjects.length,
      totalTasks: allTasks.length,
      todo: allTasks.filter((t) => t.status === 'Todo').length,
      inProgress: allTasks.filter((t) => t.status === 'In Progress').length,
      done: allTasks.filter((t) => t.status === 'Done').length,
      overdue: allTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done'
      ).length,
      myTasksCount: myTasks.length,
      myOverdueCount: myTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done'
      ).length,
      myTasks: myTasks.slice(0, 10),
      recentTasks: allTasks.slice(0, 8),
      overdueTasks: allTasks
        .filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done')
        .slice(0, 8)
    };

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
