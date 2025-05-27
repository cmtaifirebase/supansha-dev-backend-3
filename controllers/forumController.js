const { z } = require('zod');
const Forum = require('../models/Forum');
const Individual = require('../models/Individual');

// Zod schemas
const createForumSchema = z.object({
  forumTopic: z.string().min(1),
  description: z.string().min(1)
});
const commentSchema = z.object({
  comment: z.string().min(1)
});

// Create a new forum
exports.createForum = async (req, res) => {
  try {
    const parse = createForumSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors });
    }
    const { forumTopic, description } = parse.data;
    const forum = await Forum.create({
      forumTopic,
      description,
      userId: req.individual._id
    });
    res.json({ success: true, data: forum });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Error creating forum' });
  }
};

// List forums (allowed or own)
exports.listForums = async (req, res) => {
  try {
    const userId = req.individual._id;
    const forums = await Forum.find({
      $or: [
        { isAllowed: true },
        { userId }
      ]
    }).populate('userId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: forums });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Error fetching forums' });
  }
};

// Get single forum (allowed or own)
exports.getForum = async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id).populate('userId', 'name');
    if (!forum) return res.status(404).json({ success: false, error: 'Forum not found' });
    if (!forum.isAllowed && String(forum.userId._id) !== String(req.individual._id)) {
      return res.status(403).json({ success: false, error: 'Not allowed to view this forum' });
    }
    res.json({ success: true, data: forum });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Error fetching forum' });
  }
};

// Add comment to allowed forum
exports.addComment = async (req, res) => {
  try {
    const parse = commentSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors });
    }
    const forum = await Forum.findById(req.params.id);
    if (!forum) return res.status(404).json({ success: false, error: 'Forum not found' });
    if (!forum.isAllowed) return res.status(403).json({ success: false, error: 'Forum not allowed for comments' });
    forum.comments.push({
      comment: req.body.comment,
      userId: req.individual._id,
      timestamp: new Date()
    });
    await forum.save();
    res.json({ success: true, data: forum });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Error adding comment' });
  }
};

// Approve/reject forum (admin/permission)
exports.setAllowed = async (req, res) => {
  try {
    const { isAllowed } = req.body;
    if (typeof isAllowed !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isAllowed must be boolean' });
    }
    const forum = await Forum.findByIdAndUpdate(
      req.params.id,
      { isAllowed },
      { new: true }
    );
    if (!forum) return res.status(404).json({ success: false, error: 'Forum not found' });
    res.json({ success: true, data: forum });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Error updating forum' });
  }
};

// Delete forum (admin/permission/creator if not allowed)
exports.deleteForum = async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);
    if (!forum) return res.status(404).json({ success: false, error: 'Forum not found' });
    // If user is admin or has forum permission, allow delete
    if (req.user) {
      // Admin or forum permission
      if (req.user.role === 'admin' || (req.user.permissions && req.user.permissions.forum && req.user.permissions.forum.delete)) {
        await forum.deleteOne();
        return res.json({ success: true, data: 'Forum deleted' });
      }
    }
    // If individual is creator and not allowed yet
    if (req.individual && String(forum.userId) === String(req.individual._id) && !forum.isAllowed) {
      await forum.deleteOne();
      return res.json({ success: true, data: 'Forum deleted' });
    }
    return res.status(403).json({ success: false, error: 'Not authorized to delete this forum' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Error deleting forum' });
  }
};