const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// Check if a user has access to a given project (owner or member)
const userHasAccess = (project, userId) => {
  return (
    project.owner._id.toString() === userId.toString() ||
    project.members.some((m) => m._id.toString() === userId.toString())
  );
};

// GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'Admin') {
      // Admins see all projects
      query = Project.find();
    } else {
      // Members see only projects they own or are part of
      query = Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }]
      });
    }

    const projects = await query
      .populate('owner', 'name email role')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ count: projects.length, projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/projects (Admin only)
exports.createProject = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: members || []
    });

    await project.populate('owner', 'name email role');
    await project.populate('members', 'name email role');

    res.status(201).json({ message: 'Project created', project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (req.user.role !== 'Admin' && !userHasAccess(project, req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ project, tasks });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/projects/:id (Admin only)
exports.updateProject = async (req, res) => {
  try {
    const { name, description, members, status } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (members !== undefined) project.members = members;
    if (status !== undefined) project.status = status;

    await project.save();
    await project.populate('owner', 'name email role');
    await project.populate('members', 'name email role');

    res.json({ message: 'Project updated', project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/projects/:id (Admin only)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete all tasks for the project too
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: 'Project and its tasks deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/projects/:id/members (Admin only) - add a member by email
exports.addMember = async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (project.members.some((m) => m.toString() === user._id.toString())) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push(user._id);
    await project.save();
    await project.populate('owner', 'name email role');
    await project.populate('members', 'name email role');

    res.json({ message: 'Member added', project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/projects/:id/members/:userId (Admin only)
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();
    await project.populate('owner', 'name email role');
    await project.populate('members', 'name email role');

    res.json({ message: 'Member removed', project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
