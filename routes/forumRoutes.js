const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { authenticate, authenticateIndividual, requireRole } = require('../middlewares/authMiddleware');

// Public routes - only get allowed forums
router.get('/public', forumController.listAllowedForums);

// Admin routes - full CRUD access
router.post('/', authenticate, requireRole('admin'), forumController.createForum);
router.get('/', authenticate, requireRole('admin'), forumController.listForums);
router.get('/:id', authenticate, requireRole('admin'), forumController.getForum);
router.patch('/:id', authenticate, requireRole('admin'), forumController.updateForum);
router.patch('/:id/allow', authenticate, requireRole('admin'), forumController.setAllowed);
router.delete('/:id', authenticate, requireRole('admin'), forumController.deleteForum);

module.exports = router;
