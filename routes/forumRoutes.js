const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { authenticate, authenticateIndividual, requireRole } = require('../middlewares/authMiddleware');

// Individual/public routes
router.post('/', authenticateIndividual, forumController.createForum);
router.get('/', authenticateIndividual, forumController.listForums);
router.get('/:id', authenticateIndividual, forumController.getForum);
router.post('/:id/comments', authenticateIndividual, forumController.addComment);

// Admin/permission routes
router.patch('/:id/allow', authenticate, requireRole('admin'), forumController.setAllowed);
router.delete('/:id', authenticate, requireRole('admin'), forumController.deleteForum);
// Allow creator to delete their own unapproved forum
router.delete('/:id', authenticateIndividual, forumController.deleteForum);

module.exports = router;
