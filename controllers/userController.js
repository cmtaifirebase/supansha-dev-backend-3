// controllers/userController.js

const User = require('../models/User');
const { z } = require('zod');
const bcrypt = require('bcryptjs');

// Validation schema
const createUserSchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string(),
  accountType: z.enum(['individual', 'organization']),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
});

const updateRoleSchema = z.object({
  role: z.string(),
});

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    // find role by name and append permissions to user
    const role = await Role.findOne({ name: user.role });
    user.permissions = role.permissions;
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, accountType } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      accountType,
      role
    });

    await user.save();
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, status } = req.body;
    const user = await User.findById(req.params.id);
  
      if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({ success: true, data: userWithoutPassword });
    } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
      if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await user.deleteOne();
    res.json({ success: true, data: {} });
    } catch (error) {
    res.status(500).json({ success: false, error: error.message });
    }
  };

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.status = status;
    await user.save();

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.role = role;
    await user.save();

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user permissions
exports.getUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('permissions role');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      permissions: user.permissions,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update user permissions
exports.updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // Validate permissions structure
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid permissions format'
      });
    }

    // Validate each module's permissions
    for (const [module, actions] of Object.entries(permissions)) {
      if (typeof actions !== 'object') {
        return res.status(400).json({
          success: false,
          error: `Invalid permissions format for module ${module}`
        });
      }

      // Validate each action is a boolean
      for (const [action, value] of Object.entries(actions)) {
        if (typeof value !== 'boolean') {
          return res.status(400).json({
            success: false,
            error: `Invalid permission value for ${module}.${action}`
          });
        }
      }
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update permissions
    user.permissions = permissions;
    await user.save();

    res.json({
      success: true,
      data: {
        permissions: user.permissions,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update user designation
exports.updateUserDesignation = async (req, res) => {
  try {
    const { designation } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.designation = designation;
    await user.save();

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};