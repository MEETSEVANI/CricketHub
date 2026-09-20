function requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.',
      });
    }
  
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({
        status: 'error',
        message: 'Administrator access required.',
      });
    }
  
    next();
  }
  
  module.exports = {
    requireAdmin,
  };