const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember
} = require('../controllers/projectController');

const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { validate } = require('../middleware/validate');

router.use(protect);

router.get('/', getProjects);

router.post(
  '/',
  restrictTo('Admin'),
  [
    body('name').trim().notEmpty().isLength({ min: 2, max: 100 })
      .withMessage('Project name must be 2-100 characters'),
    body('description').optional().isLength({ max: 1000 })
      .withMessage('Description max 1000 characters'),
    body('members').optional().isArray().withMessage('Members must be an array')
  ],
  validate,
  createProject
);

router.get('/:id', getProjectById);
router.put('/:id', restrictTo('Admin'), updateProject);
router.delete('/:id', restrictTo('Admin'), deleteProject);

router.post(
  '/:id/members',
  restrictTo('Admin'),
  [body('email').isEmail().withMessage('Valid email required')],
  validate,
  addMember
);
router.delete('/:id/members/:userId', restrictTo('Admin'), removeMember);

module.exports = router;
