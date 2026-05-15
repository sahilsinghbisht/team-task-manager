const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboardStats
} = require('../controllers/taskController');

const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(protect);

router.get('/dashboard/stats', getDashboardStats);

router.get('/', getTasks);

router.post(
  '/',
  [
    body('title').trim().notEmpty().isLength({ min: 2, max: 200 })
      .withMessage('Title must be 2-200 characters'),
    body('project').notEmpty().isMongoId().withMessage('Valid project ID required'),
    body('description').optional().isLength({ max: 2000 }),
    body('status').optional().isIn(['Todo', 'In Progress', 'Done']),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601()
      .withMessage('Due date must be a valid date')
  ],
  validate,
  createTask
);

router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
