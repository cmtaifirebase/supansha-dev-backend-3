const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

// Authentication middleware
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Authorization token required" 
      });
    }

    // check if not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.exp < Date.now() / 1000) {
      // delete token from cookies
      res.clearCookie('token');
      return res.status(401).json({ success: false, error: 'Token expired' });
    }

    // Find user and attach to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'User account is inactive' });
    }

    // find role by name and append permissions to user
    const role = await Role.findOne({ name: user.role });
    user.permissions = role.permissions;

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};

// Authenticate individual user
exports.authenticateIndividual = async (req, res, next) => {
  try {
    const individualToken = req.cookies?.individualToken || req.header('Authorization')?.replace('Bearer ', '');
    if (!individualToken) {
      return res.status(401).json({ 
        success: false,
        message: "Authorization token required" 
      });
      }

    const decoded = jwt.verify(individualToken, process.env.JWT_SECRET);
    if (decoded.exp < Date.now() / 1000) {
      res.clearCookie('individualToken');
      return res.status(401).json({ success: false, error: 'Token expired' });
    }

    const individual = await Individual.findById(decoded.id).select('-password');
    if (!individual) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    if (individual.status !== 'active') {
      return res.status(403).json({ success: false, error: 'User account is inactive' });
    }


    req.individual = individual;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};

// Role hierarchy
const roleHierarchy = {
  'admin': 0,
  'country-admin': 1,
  'state-admin': 2,
  'regional-admin': 3,
  'district-admin': 4,
  'block-admin': 5,
  'area-admin': 6,
  'user': 7
};

// Role-based access control middleware
exports.requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Not authenticated" 
      });
    }

    // Check if user's role is in allowed roles
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Check role hierarchy
    const userRoleLevel = roleHierarchy[req.user.role];
    const hasHigherRole = allowedRoles.some(role => {
      const allowedRoleLevel = roleHierarchy[role];
      return userRoleLevel <= allowedRoleLevel;
    });

    if (hasHigherRole) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Insufficient privileges",
      requiredRoles: allowedRoles,
      yourRole: req.user.role
    });
  };
};

// Permission-based access control middleware
exports.requirePermission = (module) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Not authenticated" 
      });
    }

    // Super admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Map HTTP methods to permission types
    const methodToPermission = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
      HEAD: 'read',
      OPTIONS: 'read'
    };

    const requiredPermission = methodToPermission[req.method];
    if (!requiredPermission) {
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }

    // Check if module exists in user's permissions
    if (!req.user.permissions || !req.user.permissions[module]) {
      return res.status(403).json({
        success: false,
        message: `No permissions found for module: ${module}`
      });
    }

    const modulePermissions = req.user.permissions[module];
    if (!modulePermissions[requiredPermission]) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${requiredPermission} access required for ${module} module`,
        requiredPermission,
        module
      });
    }

    next();
  };
};

// Geographic access control middleware
exports.requireGeoAccess = (requiredLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Not authenticated" 
      });
    }

    // Super admin has global access
    if (req.user.role === 'admin') {
      return next();
    }

    // Check geographic access level
    const geoLevels = ['country', 'state', 'region', 'district', 'block', 'area'];
    const userGeoLevel = geoLevels.findIndex(level => req.user.geo[level] !== undefined);
    const requiredGeoLevel = geoLevels.indexOf(requiredLevel);

    if (userGeoLevel > requiredGeoLevel) {
      return res.status(403).json({
        success: false,
        message: "Insufficient geographic access",
        requiredAccess: requiredLevel,
        yourAccess: geoLevels[userGeoLevel] || 'none'
      });
    }

    next();
  };
};

// Admin hierarchy protection middleware
exports.requireHigherRole = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Not authenticated" 
      });
    }

    const targetRole = req.body.role;
    if (!targetRole) {
      return res.status(400).json({ 
        success: false,
        message: "Target role not specified" 
      });
    }

    // Super admin can modify anyone
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if current user's role is higher in hierarchy than target role
    const roleHierarchy = [
      'admin',
      'country-admin',
      'state-admin',
      'regional-admin',
      'district-admin',
      'block-admin',
      'area-admin'
    ];
    
    const currentRoleIndex = roleHierarchy.indexOf(req.user.role);
    const targetRoleIndex = roleHierarchy.indexOf(targetRole);

    if (currentRoleIndex >= targetRoleIndex) {
      return res.status(403).json({
        success: false,
        message: "Cannot modify users with equal or higher role",
        yourRole: req.user.role,
        targetRole
      });
    }

    next();
  };
};

// Middleware to check module-specific permissions
exports.requireModulePermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Admin has all permissions
      if (req.user.role === 'admin') {
        return next();
      }

      const user = req.user;
      const modulePermissions = user.permissions[module];

      if (!modulePermissions || !modulePermissions[action]) {
        return res.status(403).json({
          success: false,
          error: `Permission denied: ${action} access required for ${module} module`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
};

// Middleware to check if user has any access to a module
exports.hasModuleAccess = (module) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Admin has all permissions
      if (req.user.role === 'admin') {
        return next();
      }

      const user = req.user;
      // get permissions from user object
      const modulePermissions = user.permissions.get(module);

      if (!modulePermissions) {
        return res.status(403).json({
          success: false,
          error: `Access denied: No permissions for ${module} module`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
};